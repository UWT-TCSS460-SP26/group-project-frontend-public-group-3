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
import SortControl from "@/src/components/SortControl";
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
type BrowseSort =
  | "popular"
  | "rating_desc"
  | "rating_asc"
  | "review_desc"
  | "review_asc";

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
  if (
    value === "rating_desc" ||
    value === "rating_asc" ||
    value === "review_desc" ||
    value === "review_asc"
  ) {
    return value;
  }
  return "popular";
}

function sortResultsByMetric(
  items: MediaListItem[],
  metrics: Map<number, number | null>,
  sort: Exclude<BrowseSort, "popular">,
): MediaListItem[] {
  return [...items].sort((a, b) => {
    const aMetric = metrics.get(a.id) ?? -1;
    const bMetric = metrics.get(b.id) ?? -1;

    if (aMetric === bMetric) {
      return 0;
    }

    if (sort === "rating_asc" || sort === "review_asc") {
      return aMetric - bMetric;
    }

    return bMetric - aMetric;
  });
}

type DetailMetrics = {
  rating: number | null;
  reviewCount: number | null;
};

async function fetchDetailMetrics(
  items: MediaListItem[],
  isMovie: boolean,
): Promise<Map<number, DetailMetrics>> {
  const detailPairs = await Promise.all(
    items.map(async (item) => {
      try {
        const detail = isMovie
          ? await getMovieDetail(item.id)
          : await getShowDetail(item.id);
        return [
          item.id,
          {
            rating: detail.rating,
            reviewCount: detail.community.reviewCount,
          },
        ] as const;
      } catch {
        return [item.id, { rating: null, reviewCount: null }] as const;
      }
    }),
  );

  return new Map<number, DetailMetrics>(detailPairs);
}

function buildMetricMap(
  items: MediaListItem[],
  details: Map<number, DetailMetrics>,
  sort: Exclude<BrowseSort, "popular">,
): Map<number, number | null> {
  const metricMap = new Map<number, number | null>();

  for (const item of items) {
    const detail = details.get(item.id);
    if (sort === "rating_desc" || sort === "rating_asc") {
      metricMap.set(item.id, detail?.rating ?? null);
    } else {
      metricMap.set(item.id, detail?.reviewCount ?? null);
    }
  }

  return metricMap;
}

async function applyBrowseSort(
  items: MediaListItem[],
  isMovie: boolean,
  sort: BrowseSort,
): Promise<MediaListItem[]> {
  if (sort === "popular" || items.length < 2) {
    return items;
  }

  const details = await fetchDetailMetrics(items, isMovie);
  const metricMap = buildMetricMap(items, details, sort);
  return sortResultsByMetric(items, metricMap, sort);
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

    results = await applyBrowseSort(results, isMovie, sort);
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
            <div className="mt-4">
              <a href="/search" className={ui.pillSecondary}>
                Search titles
              </a>
            </div>
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

              {/* Sort control (client) - auto-applies on change */}
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore Server component rendering client component */}
              <SortControl
                action="/"
                selectId="home-sort"
                currentSort={sort}
                options={[
                  { value: "popular", label: "Popular (TMDB)" },
                  { value: "rating_desc", label: "TMDB Rating: High to Low" },
                  { value: "rating_asc", label: "TMDB Rating: Low to High" },
                  { value: "review_desc", label: "Community Reviews: High to Low" },
                  { value: "review_asc", label: "Community Reviews: Low to High" },
                ]}
                hiddenFields={{ type: mediaType }}
              />
                <p className="text-xs text-muted mt-1">
                  Sorting by TMDB Rating or Community Reviews only reorders results on this page.
                </p>
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
                <li key={`${item.mediaType}-${item.id}`} className="transform transition hover:scale-105 duration-200">
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
