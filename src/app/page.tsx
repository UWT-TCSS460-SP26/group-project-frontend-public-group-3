import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import type { ReactNode } from "react";

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

/** TMDB popular pages scanned for genre filtering (keeps requests bounded). */
const GENRE_FILTER_MAX_TMDB_PAGES = 8;

/** Popular list pages fetched in parallel during a genre scan batch. */
const GENRE_LIST_FETCH_CONCURRENCY = 4;

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

function withSelectedGenreOption(
  options: { value: string; label: string }[],
  selectedGenre: string,
): { value: string; label: string }[] {
  if (selectedGenre === "all") {
    return options;
  }

  if (options.some((option) => option.value === selectedGenre)) {
    return options;
  }

  const genreOptions = options.filter((option) => option.value !== "all");
  genreOptions.push({ value: selectedGenre, label: selectedGenre });
  genreOptions.sort((a, b) => a.label.localeCompare(b.label));

  return [{ value: "all", label: "All Genres" }, ...genreOptions];
}

function buildGenreResultsSummary(
  genre: string,
  genreUnitLabel: string,
  filteredCount: number,
  currentPage: number,
  paginationTotalPages: number,
  resultsOnPage: number,
): ReactNode {
  if (filteredCount === 0) {
    return <>No {genre} {genreUnitLabel} found in popular titles</>;
  }

  if (paginationTotalPages <= 1) {
    return (
      <>
        <span className="font-semibold text-brand">{filteredCount}</span>{" "}
        {genre} {genreUnitLabel}
      </>
    );
  }

  const rangeStart = (currentPage - 1) * TMDB_POPULAR_PAGE_SIZE + 1;
  const rangeEnd = rangeStart + resultsOnPage - 1;

  return (
    <>
      Showing{" "}
      <span className="font-semibold text-brand">
        {rangeStart}–{rangeEnd}
      </span>{" "}
      of{" "}
      <span className="font-semibold text-brand">{filteredCount}</span>{" "}
      {genre} {genreUnitLabel}
    </>
  );
}

function filterByGenre(items: MediaListItem[], genre: string): MediaListItem[] {
  if (genre === "all") {
    return items;
  }

  return items.filter((item) => (item.genres ?? []).includes(genre));
}

function appendUniqueGenreMatches(
  pool: MediaListItem[],
  seenIds: Set<number>,
  matches: MediaListItem[],
): void {
  for (const item of matches) {
    if (seenIds.has(item.id)) {
      continue;
    }
    seenIds.add(item.id);
    pool.push(item);
  }
}

function detailsMapToRecord(
  detailsById: Map<number, BrowseItemDetails>,
): Record<string, BrowseItemDetails> {
  return Object.fromEntries(detailsById);
}

function recordToDetailsMap(
  record: Record<string, BrowseItemDetails>,
): Map<number, BrowseItemDetails> {
  return new Map(
    Object.entries(record).map(([id, detail]) => [Number(id), detail]),
  );
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
): Promise<{ results: MediaListItem[] }> {
  if (items.length === 0) {
    return { results: items };
  }

  const details = await fetchBrowseItemDetails(items, isMovie);
  let results = attachGenres(items, details);

  if (sort !== "popular") {
    const metricMap = buildMetricMap(results, details, sort);
    results = sortResultsByMetric(results, metricMap, sort);
  }

  return { results };
}

async function scanPopularCatalog(
  fetchPopular: (page: number) => ReturnType<typeof getPopularMovies>,
  isMovie: boolean,
  tmdbTotalPages: number,
): Promise<{
  catalog: MediaListItem[];
  detailsById: Map<number, BrowseItemDetails>;
}> {
  const maxScanPages = Math.min(tmdbTotalPages, GENRE_FILTER_MAX_TMDB_PAGES);
  const catalog: MediaListItem[] = [];
  const seenIds = new Set<number>();
  const detailsById = new Map<number, BrowseItemDetails>();

  for (
    let batchStart = 1;
    batchStart <= maxScanPages;
    batchStart += GENRE_LIST_FETCH_CONCURRENCY
  ) {
    const batchEnd = Math.min(
      batchStart + GENRE_LIST_FETCH_CONCURRENCY - 1,
      maxScanPages,
    );
    const pageNumbers = Array.from(
      { length: batchEnd - batchStart + 1 },
      (_, index) => batchStart + index,
    );
    const responses = await Promise.all(
      pageNumbers.map((pageNumber) => fetchPopular(pageNumber)),
    );
    const batchItems = responses.flatMap((response) => response.results);
    const details = await fetchBrowseItemDetails(batchItems, isMovie);

    for (const [id, detail] of details) {
      detailsById.set(id, detail);
    }

    for (const response of responses) {
      const enriched = attachGenres(response.results, details);
      appendUniqueGenreMatches(catalog, seenIds, enriched);
    }
  }

  return { catalog, detailsById };
}

async function getCachedPopularCatalog(
  isMovie: boolean,
  tmdbTotalPages: number,
): Promise<{
  catalog: MediaListItem[];
  detailsById: Map<number, BrowseItemDetails>;
}> {
  const cached = await unstable_cache(
    async () => {
      const fetchPopular = isMovie ? getPopularMovies : getPopularTvShows;
      const scan = await scanPopularCatalog(
        fetchPopular,
        isMovie,
        tmdbTotalPages,
      );
      return {
        catalog: scan.catalog,
        detailsById: detailsMapToRecord(scan.detailsById),
      };
    },
    ["popular-catalog", isMovie ? "movie" : "show", String(tmdbTotalPages)],
    { revalidate: 300 },
  )();

  return {
    catalog: cached.catalog,
    detailsById: recordToDetailsMap(cached.detailsById),
  };
}

async function loadBrowseGenreOptions(
  isMovie: boolean,
  tmdbTotalPages: number,
  selectedGenre: string,
): Promise<{ value: string; label: string }[]> {
  const { catalog } = await getCachedPopularCatalog(isMovie, tmdbTotalPages);
  return withSelectedGenreOption(collectGenreOptions(catalog), selectedGenre);
}

async function collectGenreFilteredPage(
  isMovie: boolean,
  genre: string,
  genrePage: number,
  sort: BrowseSort,
  tmdbTotalPages: number,
): Promise<{
  results: MediaListItem[];
  paginationTotalPages: number;
  currentPage: number;
  filteredCount: number;
}> {
  const pageSize = TMDB_POPULAR_PAGE_SIZE;
  const { catalog, detailsById } = await getCachedPopularCatalog(
    isMovie,
    tmdbTotalPages,
  );

  let pool = filterByGenre(catalog, genre);

  if (sort !== "popular" && pool.length > 1) {
    const metricMap = buildMetricMap(pool, detailsById, sort);
    pool = sortResultsByMetric(pool, metricMap, sort);
  }

  const filteredCount = pool.length;
  const paginationTotalPages =
    filteredCount === 0 ? 0 : Math.ceil(filteredCount / pageSize);
  const currentPage =
    paginationTotalPages === 0
      ? 1
      : clampPage(genrePage, paginationTotalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const results = pool.slice(startIdx, startIdx + pageSize);

  return {
    results,
    paginationTotalPages,
    currentPage,
    filteredCount,
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

    const genreOptionsPromise = loadBrowseGenreOptions(
      isMovie,
      paginationTotalPages,
      genre,
    );

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

      const filtered = await applyBrowseFilters(results, isMovie, sort);
      results = filtered.results;
    } else {
      const genreBrowse = await collectGenreFilteredPage(
        isMovie,
        genre,
        page,
        sort,
        paginationTotalPages,
      );

      if (
        genreBrowse.paginationTotalPages > 0 &&
        page > genreBrowse.paginationTotalPages
      ) {
        redirect(
          buildPageHref(
            mediaType,
            genreBrowse.paginationTotalPages,
            sort,
            genre,
          ),
        );
      }

      results = genreBrowse.results;
      paginationTotalPages = genreBrowse.paginationTotalPages;
      currentPage = genreBrowse.currentPage;
      browsableCount = genreBrowse.filteredCount;
    }

    genreOptions = await genreOptionsPromise;
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

  const genreUnitLabel =
    browsableCount === 1
      ? isMovie
        ? "movie"
        : "TV show"
      : mediaLabelPlural;

  const resultsSummary =
    genre === "all"
      ? (
          <>
            <span className="font-semibold text-brand">{browsableCount}</span>{" "}
            popular {popularUnitLabel}
          </>
        )
      : buildGenreResultsSummary(
          genre,
          genreUnitLabel,
          browsableCount,
          currentPage,
          paginationTotalPages,
          results.length,
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
