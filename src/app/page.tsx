import { Inter, Montserrat } from "next/font/google";
import { redirect } from "next/navigation";

import {
  getMovieDetail,
  getPopularMovies,
  getPopularTvShows,
  getShowDetail,
} from "@/lib/api";
import type { MediaListItem, MediaType } from "@/lib/types";
import MediaResultCard from "@/src/components/MediaResultCard";
import PaginationNav from "@/src/components/PaginationNav";
import PopularBrowseTabs from "@/src/components/PopularBrowseTabs";
import {
  TMDB_MAX_PAGE,
  capPopularBrowsableResults,
  capPopularTotalPages,
  clampPage,
  parsePopularPageParam,
  parseRawPageParam,
} from "@/src/lib/pagination";
import { ui } from "@/src/lib/ui";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

type BrowseMediaType = Extract<MediaType, "movie" | "show">;
type BrowseSort = "popular" | "rating_desc" | "rating_asc";

type HomePageProps = {
  searchParams: Promise<{ type?: string; page?: string; sort?: string }>;
};

function parseMediaType(value: string | undefined): BrowseMediaType {
  return value === "show" ? "show" : "movie";
}

function buildPageHref(type: BrowseMediaType, page: number, sort: BrowseSort): string {
  const params = new URLSearchParams({
    type,
    page: String(page),
    sort,
  });
  return `/?${params.toString()}`;
}

function parseSort(value: string | undefined): BrowseSort {
  if (value === "rating_desc" || value === "rating_asc") {
    return value;
  }
  return "popular";
}

function sortResultsByRating(
  items: MediaListItem[],
  ratings: Map<number, number | null>,
  sort: Exclude<BrowseSort, "popular">,
): MediaListItem[] {
  return [...items].sort((a, b) => {
    const aRating = ratings.get(a.id) ?? -1;
    const bRating = ratings.get(b.id) ?? -1;

    if (aRating === bRating) {
      return 0;
    }

    if (sort === "rating_asc") {
      return aRating - bRating;
    }

    return bRating - aRating;
  });
}

export default async function HomePage({ searchParams }: Readonly<HomePageProps>) {
  const params = await searchParams;
  const mediaType = parseMediaType(params.type);
  const sort = parseSort(params.sort);

  const requestedPage = parseRawPageParam(params.page);
  if (requestedPage !== null && requestedPage > TMDB_MAX_PAGE) {
    redirect(buildPageHref(mediaType, TMDB_MAX_PAGE, sort));
  }

  const page = parsePopularPageParam(params.page);
  const isMovie = mediaType === "movie";
  const mediaLabelPlural = isMovie ? "movies" : "TV shows";
  const pageTitle = isMovie ? "Popular Movies" : "Popular TV Shows";

  let errorMessage: string | null = null;
  let results: MediaListItem[] = [];
  let browsableCount = 0;
  let paginationTotalPages = 0;
  let currentPage = 1;

  try {
    const data = isMovie
      ? await getPopularMovies(page)
      : await getPopularTvShows(page);
    results = data.results;
    paginationTotalPages = capPopularTotalPages(data.totalPages);
    currentPage = clampPage(data.page, paginationTotalPages);
    browsableCount = capPopularBrowsableResults(
      data.totalResults,
      paginationTotalPages,
      currentPage,
      results.length,
    );

    if (sort !== "popular" && results.length > 1) {
      const ratingPairs = await Promise.all(
        results.map(async (item) => {
          try {
            const detail = isMovie
              ? await getMovieDetail(item.id)
              : await getShowDetail(item.id);
            return [item.id, detail.rating] as const;
          } catch {
            return [item.id, null] as const;
          }
        }),
      );

      const ratings = new Map<number, number | null>(ratingPairs);
      results = sortResultsByRating(results, ratings, sort);
    }
  } catch (err) {
    errorMessage =
      err instanceof Error
        ? err.message
        : `We could not load popular ${mediaLabelPlural}. Please try again.`;
  }

  const popularCountSuffix = browsableCount === 1 ? "" : "s";
  let popularUnitLabel = `TV show${popularCountSuffix}`;
  if (isMovie) {
    popularUnitLabel = `movie${popularCountSuffix}`;
  }

  return (
    <div className={`${ui.page} ${inter.className}`}>
      <div className={ui.container}>
        <header className="mb-6">
          <p className={ui.eyebrow}>Browse</p>
          <h1 className={`${ui.title} ${montserrat.className}`}>{pageTitle}</h1>
          <p className={ui.subtitle}>
            Trending picks from TMDB. Use the search bar above to find something
            specific.
          </p>
        </header>

        <PopularBrowseTabs activeType={mediaType} />

        {errorMessage && (
          <section role="alert" className={`mb-8 ${ui.alert}`}>
            <p className={`font-semibold ${montserrat.className}`}>
              Could not load popular {mediaLabelPlural}
            </p>
            <p className="mt-1 text-sm">{errorMessage}</p>
          </section>
        )}

        {!errorMessage && results.length === 0 && (
          <section className={ui.emptyState}>
            <p className={`text-lg font-semibold text-brand ${montserrat.className}`}>
              No popular {mediaLabelPlural} found
            </p>
            <p className="mt-2 text-sm text-muted">
              Try again later or search for a title using the bar above.
            </p>
          </section>
        )}

        {!errorMessage && results.length > 0 && (
          <section>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-muted">
                  <span className="font-semibold text-brand">{browsableCount}</span>{" "}
                  popular {popularUnitLabel}
                </p>
                {paginationTotalPages > 1 && (
                  <p className="text-sm text-muted">
                    Page {currentPage} of {paginationTotalPages}
                  </p>
                )}
              </div>

              <form action="/" method="get" className="flex items-center gap-2">
                <input type="hidden" name="type" value={mediaType} />
                <label htmlFor="home-sort" className={ui.label}>
                  Sort
                </label>
                <select id="home-sort" name="sort" defaultValue={sort} className={ui.select}>
                  <option value="popular">Popular (TMDB)</option>
                  <option value="rating_desc">TMDB Rating: High to Low</option>
                  <option value="rating_asc">TMDB Rating: Low to High</option>
                </select>
                <button type="submit" className={ui.pillSecondary}>
                  Apply
                </button>
              </form>
            </div>

            <PaginationNav
              currentPage={currentPage}
              totalPages={paginationTotalPages}
              buildHref={(p) => buildPageHref(mediaType, p, sort)}
              ariaLabel={`Popular ${mediaLabelPlural} pagination (top)`}
              formAction="/"
              formFields={{ type: mediaType, sort }}
              placement="top"
            />

            <ul className="grid gap-5">
              {results.map((item) => (
                <li key={`${item.mediaType}-${item.id}`}>
                  <MediaResultCard item={item} />
                </li>
              ))}
            </ul>

            <PaginationNav
              currentPage={currentPage}
              totalPages={paginationTotalPages}
              buildHref={(p) => buildPageHref(mediaType, p, sort)}
              ariaLabel={`Popular ${mediaLabelPlural} pagination (bottom)`}
              formAction="/"
              formFields={{ type: mediaType, sort }}
              placement="bottom"
            />
          </section>
        )}
      </div>
    </div>
  );
}
