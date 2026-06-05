import { Inter, Montserrat } from "next/font/google";
import {
  getMovieDetail,
  getShowDetail,
  searchMovies,
  searchTvShows,
} from "@/lib/api";
import type { MediaListItem, MediaType } from "@/lib/types";
import MediaResultCard from "@/src/components/MediaResultCard";
import PaginationNav from "@/src/components/PaginationNav";
import { parsePageParam } from "@/src/lib/pagination";
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

type SearchMediaType = Extract<MediaType, "movie" | "show">;
type SearchSort =
  | "relevance"
  | "rating_desc"
  | "rating_asc"
  | "review_desc"
  | "review_asc";

type SearchPageProps = {
  searchParams: Promise<{
    type?: string;
    title?: string;
    page?: string;
    sort?: string;
  }>;
};

function parseMediaType(value: string | undefined): SearchMediaType {
  return value === "show" ? "show" : "movie";
}

function buildSearchHref(
  type: SearchMediaType,
  title: string,
  page: number,
  sort: SearchSort,
): string {
  const params = new URLSearchParams({
    type,
    title,
    page: String(page),
    sort,
  });
  return `/search?${params.toString()}`;
}

function parseSort(value: string | undefined): SearchSort {
  if (
    value === "rating_desc" ||
    value === "rating_asc" ||
    value === "review_desc" ||
    value === "review_asc"
  ) {
    return value;
  }
  return "relevance";
}

function sortResultsByMetric(
  items: MediaListItem[],
  metrics: Map<number, number | null>,
  sort: Exclude<SearchSort, "relevance">,
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
  sort: Exclude<SearchSort, "relevance">,
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

async function applySearchSort(
  items: MediaListItem[],
  isMovie: boolean,
  sort: SearchSort,
): Promise<MediaListItem[]> {
  if (sort === "relevance" || items.length < 2) {
    return items;
  }

  const details = await fetchDetailMetrics(items, isMovie);
  const metricMap = buildMetricMap(items, details, sort);
  return sortResultsByMetric(items, metricMap, sort);
}

export default async function SearchPage({
  searchParams,
}: Readonly<SearchPageProps>) {
  const params = await searchParams;
  const mediaType = parseMediaType(params.type);
  const title = params.title?.trim() ?? "";
  const page = parsePageParam(params.page);
  const sort = parseSort(params.sort);
  const hasQuery = title.length > 0;

  const isMovie = mediaType === "movie";
  const mediaLabel = isMovie ? "movie" : "TV show";
  const mediaLabelPlural = isMovie ? "movies" : "TV shows";

  let errorMessage: string | null = null;
  let results: MediaListItem[] = [];
  let totalResults = 0;
  let totalPages = 0;
  let currentPage = 1;

  if (hasQuery) {
    try {
      const data = isMovie
        ? await searchMovies(title, page)
        : await searchTvShows(title, page);
      results = data.results;
      totalResults = data.totalResults;
      totalPages = data.totalPages;
      currentPage = data.page;

      results = await applySearchSort(results, isMovie, sort);
    } catch (err) {
      errorMessage =
        err instanceof Error
          ? err.message
          : "We could not load results. Please try again.";
    }
  }

  return (
    <div className={`${ui.page} ${inter.className}`}>
      <div className={ui.container}>
        <header className="mb-12">
          <p className={ui.eyebrow}>Discover</p>
          <h1 className={`${ui.title} ${montserrat.className}`}>Search</h1>
          <p className={ui.subtitle}>
            Find movies and TV shows by title using the search bar above.
          </p>
        </header>

        {hasQuery && errorMessage && (
          <section role="alert" className={`mb-8 ${ui.alert}`}>
            <p className={`font-semibold ${montserrat.className}`}>
              Could not search {mediaLabelPlural}
            </p>
            <p className="mt-1 text-sm">{errorMessage}</p>
          </section>
        )}

        {hasQuery && !errorMessage && results.length === 0 && (
          <section className={ui.emptyState}>
            <p className={`text-lg font-semibold text-brand ${montserrat.className}`}>
              No {mediaLabelPlural} found
            </p>
            <p className="mt-2 text-sm text-muted">
              Nothing matched &ldquo;{title}&rdquo; in {mediaLabelPlural}. Try
              another title or switch the type in the search bar.
            </p>
          </section>
        )}

        {hasQuery && !errorMessage && results.length > 0 && (
          <section>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-muted">
                  <span className="font-semibold text-brand">{totalResults}</span>{" "}
                  {mediaLabel}
                  {totalResults === 1 ? "" : "s"} for &ldquo;{title}&rdquo;
                </p>
                {totalPages > 1 && (
                  <p className="text-sm text-muted">
                    Page {currentPage} of {totalPages}
                  </p>
                )}
              </div>

              <form action="/search" method="get" className="flex items-center gap-2">
                <input type="hidden" name="type" value={mediaType} />
                <input type="hidden" name="title" value={title} />
                <label htmlFor="search-sort" className={ui.label}>
                  Sort
                </label>
                <select
                  id="search-sort"
                  name="sort"
                  defaultValue={sort}
                  className={ui.select}
                >
                  <option value="relevance">Relevance</option>
                  <option value="rating_desc">TMDB Rating: High to Low</option>
                  <option value="rating_asc">TMDB Rating: Low to High</option>
                  <option value="review_desc">Community Reviews: High to Low</option>
                  <option value="review_asc">Community Reviews: Low to High</option>
                </select>
                <button type="submit" className={ui.pillSecondary}>
                  Apply
                </button>
              </form>
            </div>

            <PaginationNav
              currentPage={currentPage}
              totalPages={totalPages}
              buildHref={(p) => buildSearchHref(mediaType, title, p, sort)}
              ariaLabel="Search results pagination (top)"
              formAction="/search"
              formFields={{ type: mediaType, title, sort }}
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
              totalPages={totalPages}
              buildHref={(p) => buildSearchHref(mediaType, title, p, sort)}
              ariaLabel="Search results pagination (bottom)"
              formAction="/search"
              formFields={{ type: mediaType, title, sort }}
              placement="bottom"
            />
          </section>
        )}

        {!hasQuery && (
          <section className={`${ui.emptyState} bg-mint-soft/40`}>
            <p className="text-sm text-muted">
              Choose Movies or TV Shows in the search bar, enter a title, and
              press Search.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
