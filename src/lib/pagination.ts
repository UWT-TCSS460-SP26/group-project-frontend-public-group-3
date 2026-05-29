/** TMDB popular browse endpoints cap at 500 pages (10,000 results). */
export const TMDB_MAX_PAGE = 500;

/** Default results per page for TMDB popular lists (20 × 500 = 10,000). */
export const TMDB_POPULAR_PAGE_SIZE = 20;

export function parsePageParam(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
}

export function parsePopularPageParam(value: string | undefined): number {
  return Math.min(parsePageParam(value), TMDB_MAX_PAGE);
}

export function parseRawPageParam(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }
  return Math.floor(parsed);
}

export function capPopularTotalPages(totalPages: number): number {
  if (totalPages < 1) {
    return 0;
  }
  return Math.min(totalPages, TMDB_MAX_PAGE);
}

/** Total titles the user can browse given pagination caps and page size. */
export function capPopularBrowsableResults(
  totalResults: number,
  paginationTotalPages: number,
  currentPage: number,
  resultsOnPage: number,
): number {
  if (paginationTotalPages < 1) {
    return 0;
  }
  if (paginationTotalPages === 1) {
    return resultsOnPage;
  }

  const fullPageSize =
    currentPage < paginationTotalPages && resultsOnPage > 0
      ? resultsOnPage
      : TMDB_POPULAR_PAGE_SIZE;

  if (currentPage === paginationTotalPages) {
    return Math.min(
      totalResults,
      (paginationTotalPages - 1) * fullPageSize + resultsOnPage,
    );
  }

  return Math.min(totalResults, paginationTotalPages * fullPageSize);
}

export function clampPage(page: number, totalPages: number): number {
  if (totalPages < 1) {
    return Math.max(1, page);
  }
  return Math.min(Math.max(1, page), totalPages);
}

export type PageItem = number | "ellipsis";

export function getVisiblePages(
  currentPage: number,
  totalPages: number,
  siblingCount = 2,
): PageItem[] {
  if (totalPages <= 1) {
    return [];
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);

  for (let i = currentPage - siblingCount; i <= currentPage + siblingCount; i++) {
    if (i >= 1 && i <= totalPages) {
      pages.add(i);
    }
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: PageItem[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("ellipsis");
    }
    result.push(sorted[i]);
  }

  return result;
}
