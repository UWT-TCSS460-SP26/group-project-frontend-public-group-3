import { Inter, Montserrat } from "next/font/google";
import { searchMovies, searchTvShows } from "@/lib/api";
import type { MediaListItem, MediaType } from "@/lib/types";
import MediaResultCard from "@/src/components/MediaResultCard";
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

type SearchPageProps = {
  searchParams: Promise<{ type?: string; title?: string; page?: string }>;
};

function parseMediaType(value: string | undefined): SearchMediaType {
  return value === "show" ? "show" : "movie";
}

function buildSearchHref(
  type: SearchMediaType,
  title: string,
  page: number,
): string {
  const params = new URLSearchParams({
    type,
    title,
    page: String(page),
  });
  return `/search?${params.toString()}`;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const mediaType = parseMediaType(params.type);
  const title = params.title?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);
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

            <ul className="grid gap-5">
              {results.map((item) => (
                <li key={`${item.mediaType}-${item.id}`}>
                  <MediaResultCard item={item} />
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <nav
                className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-8"
                aria-label="Search results pagination"
              >
                {currentPage > 1 ? (
                  <a
                    href={buildSearchHref(mediaType, title, currentPage - 1)}
                    className={ui.paginationLink}
                  >
                    Previous
                  </a>
                ) : (
                  <span aria-hidden="true" />
                )}
                {currentPage < totalPages ? (
                  <a
                    href={buildSearchHref(mediaType, title, currentPage + 1)}
                    className={ui.pillMint}
                  >
                    Next
                  </a>
                ) : (
                  <span aria-hidden="true" />
                )}
              </nav>
            )}
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
