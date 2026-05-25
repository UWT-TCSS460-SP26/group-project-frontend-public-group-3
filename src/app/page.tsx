import { Inter, Montserrat } from "next/font/google";

import { getPopularMovies, getPopularTvShows } from "@/lib/api";
import type { MediaListItem, MediaType } from "@/lib/types";
import MediaResultCard from "@/src/components/MediaResultCard";
import PopularBrowseTabs from "@/src/components/PopularBrowseTabs";
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

type HomePageProps = {
  searchParams: Promise<{ type?: string; page?: string }>;
};

function parseMediaType(value: string | undefined): BrowseMediaType {
  return value === "show" ? "show" : "movie";
}

function buildPageHref(type: BrowseMediaType, page: number): string {
  const params = new URLSearchParams({
    type,
    page: String(page),
  });
  return `/?${params.toString()}`;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const mediaType = parseMediaType(params.type);
  const page = Math.max(1, Number(params.page) || 1);
  const isMovie = mediaType === "movie";
  const mediaLabelPlural = isMovie ? "movies" : "TV shows";
  const pageTitle = isMovie ? "Popular Movies" : "Popular TV Shows";

  let errorMessage: string | null = null;
  let results: MediaListItem[] = [];
  let totalResults = 0;
  let totalPages = 0;
  let currentPage = 1;

  try {
    const data = isMovie
      ? await getPopularMovies(page)
      : await getPopularTvShows(page);
    results = data.results;
    totalResults = data.totalResults;
    totalPages = data.totalPages;
    currentPage = data.page;
  } catch (err) {
    errorMessage =
      err instanceof Error
        ? err.message
        : `We could not load popular ${mediaLabelPlural}. Please try again.`;
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
              <p className="text-sm text-muted">
                <span className="font-semibold text-brand">{totalResults}</span>{" "}
                popular{" "}
                {mediaLabelPlural === "movies"
                  ? `movie${totalResults === 1 ? "" : "s"}`
                  : `TV show${totalResults === 1 ? "" : "s"}`}
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
                aria-label={`Popular ${mediaLabelPlural} pagination`}
              >
                {currentPage > 1 ? (
                  <a
                    href={buildPageHref(mediaType, currentPage - 1)}
                    className={ui.paginationLink}
                  >
                    Previous
                  </a>
                ) : (
                  <span aria-hidden="true" />
                )}
                {currentPage < totalPages ? (
                  <a
                    href={buildPageHref(mediaType, currentPage + 1)}
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
      </div>
    </div>
  );
}
