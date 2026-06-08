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
  TMDB_POPULAR_PAGE_SIZE,
  capPopularBrowsableResults,
  capPopularTotalPages,
  clampPage,
  parsePopularPageParam,
  parseRawPageParam,
} from "@/src/lib/pagination";
import { ui } from "@/src/lib/ui";

type BrowseMediaType = Extract<MediaType, "movie" | "show">;
type BrowseSort =
  | "popular"
  | "rating_desc"
  | "rating_asc"
  | "review_desc"
  | "review_asc";

/** Max TMDB popular pages scanned per request when filtering by genre. */
const GENRE_FILTER_MAX_TMDB_PAGES = 25;

type HomePageProps = {
  searchParams: Promise<{ type?: string; page?: string; sort?: string; genre?: string }>;
};

function parseMediaType(value: string | undefined): BrowseMediaType {
  return value === "show" ? "show" : "movie";
}

function parseGenre(value: string | undefined): string {
  const genre = value?.trim();
  return genre ? genre : "all";
}

function buildPageHref(
  type: BrowseMediaType,
  page: number,
  sort: BrowseSort,
  genre: string,
): string {
  const params = new URLSearchParams({
    type,
    page: String(page),
    sort,
  });
  if (genre !== "all") {
    params.set("genre", genre);
  }
  return `/?${params.toString()}`;
}

function browseFormFields(
  mediaType: BrowseMediaType,
  sort: BrowseSort,
  genre: string,
): Record<string, string> {
  const fields: Record<string, string> = {
    type: mediaType,
    sort,
  };
  if (genre !== "all") {
    fields.genre = genre;
  }
  return fields;
}

function browseGenreHiddenFields(
  mediaType: BrowseMediaType,
  sort: BrowseSort,
): Record<string, string> {
  return {
    type: mediaType,
    sort,
  };
}

function browseSortHiddenFields(
  mediaType: BrowseMediaType,
  genre: string,
): Record<string, string> {
  const fields: Record<string, string> = {
    type: mediaType,
  };
  if (genre !== "all") {
    fields.genre = genre;
  }
  return fields;
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

type BrowseItemDetails = {
  rating: number | null;
  reviewCount: number | null;
  genres: string[];
};

async function fetchBrowseItemDetails(
  items: MediaListItem[],
  isMovie: boolean,
): Promise<Map<number, BrowseItemDetails>> {
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
            genres: detail.genres,
          },
        ] as const;
      } catch {
        return [
          item.id,
          { rating: null, reviewCount: null, genres: item.genres ?? [] },
        ] as const;
      }
    }),
  );

  return new Map<number, BrowseItemDetails>(detailPairs);
}

function attachGenres(
  items: MediaListItem[],
  details: Map<number, BrowseItemDetails>,
): MediaListItem[] {
  return items.map((item) => ({
    ...item,
    genres: item.genres ?? details.get(item.id)?.genres ?? [],
  }));
}

function collectGenreOptions(items: MediaListItem[]): { value: string; label: string }[] {
  const genres = new Set<string>();

  for (const item of items) {
    for (const genre of item.genres ?? []) {
      genres.add(genre);
    }
  }

  return [
    { value: "all", label: "All Genres" },
    ...[...genres]
      .sort((a, b) => a.localeCompare(b))
      .map((genre) => ({ value: genre, label: genre })),
  ];
}

function filterByGenre(items: MediaListItem[], genre: string): MediaListItem[] {
  if (genre === "all") {
    return items;
  }

  return items.filter((item) => (item.genres ?? []).includes(genre));
}

function buildMetricMap(
  items: MediaListItem[],
  details: Map<number, BrowseItemDetails>,
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

async function applyBrowseFilters(
  items: MediaListItem[],
  isMovie: boolean,
  sort: BrowseSort,
  genre: string,
): Promise<{
  results: MediaListItem[];
  genreOptions: { value: string; label: string }[];
}> {
  if (items.length === 0) {
    return { results: items, genreOptions: [{ value: "all", label: "All Genres" }] };
  }

  const details = await fetchBrowseItemDetails(items, isMovie);
  let results = attachGenres(items, details);
  const genreOptions = collectGenreOptions(results);

  if (sort !== "popular") {
    const metricMap = buildMetricMap(results, details, sort);
    results = sortResultsByMetric(results, metricMap, sort);
  }

  return { results, genreOptions };
}

async function collectGenreFilteredPage(
  isMovie: boolean,
  genre: string,
  genrePage: number,
  sort: BrowseSort,
  tmdbTotalPages: number,
): Promise<{
  results: MediaListItem[];
  genreOptions: { value: string; label: string }[];
  paginationTotalPages: number;
  currentPage: number;
  filteredCount: number;
}> {
  const fetchPopular = isMovie ? getPopularMovies : getPopularTvShows;
  const pageSize = TMDB_POPULAR_PAGE_SIZE;
  const startIdx = (genrePage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const maxScanPages = Math.min(tmdbTotalPages, GENRE_FILTER_MAX_TMDB_PAGES);

  let pool: MediaListItem[] = [];
  const detailsById = new Map<number, BrowseItemDetails>();
  let genreOptions: { value: string; label: string }[] = [
    { value: "all", label: "All Genres" },
  ];
  let scannedPages = 0;

  for (let tmdbPage = 1; tmdbPage <= maxScanPages; tmdbPage++) {
    const data = await fetchPopular(tmdbPage);
    scannedPages = tmdbPage;

    const details = await fetchBrowseItemDetails(data.results, isMovie);
    for (const [id, detail] of details) {
      detailsById.set(id, detail);
    }

    const enriched = attachGenres(data.results, details);
    if (tmdbPage === 1) {
      genreOptions = collectGenreOptions(enriched);
    }

    pool.push(...filterByGenre(enriched, genre));

    if (sort === "popular" && pool.length >= endIdx) {
      break;
    }
  }

  if (sort !== "popular" && pool.length > 1) {
    const metricMap = buildMetricMap(pool, detailsById, sort);
    pool = sortResultsByMetric(pool, metricMap, sort);
  }

  const results = pool.slice(startIdx, endIdx);
  const canScanMore = scannedPages < maxScanPages;
  const hasNextPage = pool.length > endIdx || (canScanMore && pool.length >= endIdx);
  const knownPages = Math.max(1, Math.ceil(pool.length / pageSize));
  const paginationTotalPages = hasNextPage
    ? Math.max(knownPages, genrePage + 1)
    : Math.max(knownPages, genrePage);

  return {
    results,
    genreOptions,
    paginationTotalPages,
    currentPage: genrePage,
    filteredCount: pool.length,
  };
}

export default async function HomePage({ searchParams }: Readonly<HomePageProps>) {
  const params = await searchParams;
  const mediaType = parseMediaType(params.type);
  const sort = parseSort(params.sort);
  const genre = parseGenre(params.genre);

  const requestedPage = parseRawPageParam(params.page);
  if (requestedPage !== null && requestedPage > TMDB_MAX_PAGE) {
    redirect(buildPageHref(mediaType, TMDB_MAX_PAGE, sort, genre));
  }

  const page = parsePopularPageParam(params.page);
  const isMovie = mediaType === "movie";
  const mediaLabelPlural = isMovie ? "movies" : "TV shows";
  const pageTitle = isMovie ? "Popular Movies" : "Popular TV Shows";

  let errorMessage: string | null = null;
  let results: MediaListItem[] = [];
  let genreOptions = [{ value: "all", label: "All Genres" }];
  let browsableCount = 0;
  let paginationTotalPages = 0;
  let currentPage = 1;
  let hasBrowseData = false;

  try {
    const fetchPopular = isMovie ? getPopularMovies : getPopularTvShows;
    const seedData = await fetchPopular(1);
    hasBrowseData = seedData.results.length > 0;
    paginationTotalPages = capPopularTotalPages(seedData.totalPages);

    if (genre === "all") {
      const data = page === 1 ? seedData : await fetchPopular(page);
      results = data.results;
      currentPage = clampPage(data.page, paginationTotalPages);
      browsableCount = capPopularBrowsableResults(
        data.totalResults,
        paginationTotalPages,
        currentPage,
        results.length,
      );

      const filtered = await applyBrowseFilters(results, isMovie, sort, genre);
      results = filtered.results;
      genreOptions = filtered.genreOptions;
    } else {
      const genreBrowse = await collectGenreFilteredPage(
        isMovie,
        genre,
        page,
        sort,
        paginationTotalPages,
      );
      results = genreBrowse.results;
      genreOptions = genreBrowse.genreOptions;
      paginationTotalPages = genreBrowse.paginationTotalPages;
      currentPage = genreBrowse.currentPage;
      browsableCount = genreBrowse.filteredCount;
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

  const resultsSummary =
    genre === "all"
      ? (
          <>
            <span className="font-semibold text-brand">{browsableCount}</span>{" "}
            popular {popularUnitLabel}
          </>
        )
      : (
          <>
            Showing{" "}
            <span className="font-semibold text-brand">{results.length}</span>{" "}
            {genre} {popularUnitLabel}
            {paginationTotalPages > 1 && (
              <>
                {" "}
                (page {currentPage} of {paginationTotalPages})
              </>
            )}
          </>
        );

  return (
    <div className={ui.page}>
      <div className={ui.container}>
        <header className="mb-6">
          <p className={ui.eyebrow}>Browse</p>
          <h1 className={ui.title}>{pageTitle}</h1>
          <p className={ui.subtitle}>
            Trending picks from TMDB. Use the search bar above to find something
            specific.
          </p>
        </header>

        <PopularBrowseTabs activeType={mediaType} sort={sort} genre={genre} />

        {errorMessage && (
          <section role="alert" className={`mb-8 ${ui.alert}`}>
            <p className={ui.alertTitle}>
              Could not load popular {mediaLabelPlural}
            </p>
            <p className="mt-1 text-sm">{errorMessage}</p>
          </section>
        )}

        {!errorMessage && !hasBrowseData && (
          <section className={ui.emptyState}>
            <p className={ui.emptyStateTitle}>
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

        {!errorMessage && hasBrowseData && (
          <section>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{resultsSummary}</p>
                {paginationTotalPages > 1 && (
                  <p className="text-sm text-muted">
                    Page {currentPage} of {paginationTotalPages}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-end gap-3">
                {/* Genre filter (client) - auto-applies on change */}
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore Server component rendering client component */}
                <SortControl
                  action="/"
                  selectId="home-genre"
                  currentSort={genre}
                  label="Genre"
                  paramName="genre"
                  options={genreOptions}
                  hiddenFields={browseGenreHiddenFields(mediaType, sort)}
                />

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
                  hiddenFields={browseSortHiddenFields(mediaType, genre)}
                />
              </div>
            </div>

            <PaginationNav
              currentPage={currentPage}
              totalPages={paginationTotalPages}
              buildHref={(p) => buildPageHref(mediaType, p, sort, genre)}
              ariaLabel={`Popular ${mediaLabelPlural} pagination (top)`}
              formAction="/"
              formFields={browseFormFields(mediaType, sort, genre)}
              placement="top"
            />

            {results.length === 0 ? (
              <section className={ui.emptyState}>
                <p className={ui.emptyStateTitle}>
                  No {genre} {mediaLabelPlural} on this page
                </p>
                <p className="mt-2 text-sm text-muted">
                  Try another genre, sort option, or page.
                </p>
              </section>
            ) : (
              <ul className="grid gap-5">
                {results.map((item) => (
                  <li key={`${item.mediaType}-${item.id}`} className="transform transition hover:scale-105 duration-200">
                    <MediaResultCard item={item} />
                  </li>
                ))}
              </ul>
            )}

            <PaginationNav
              currentPage={currentPage}
              totalPages={paginationTotalPages}
              buildHref={(p) => buildPageHref(mediaType, p, sort, genre)}
              ariaLabel={`Popular ${mediaLabelPlural} pagination (bottom)`}
              formAction="/"
              formFields={browseFormFields(mediaType, sort, genre)}
              placement="bottom"
            />
          </section>
        )}
      </div>
    </div>
  );
}
