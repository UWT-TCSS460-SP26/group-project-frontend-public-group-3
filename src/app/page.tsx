import { Inter, Montserrat } from "next/font/google";
import { redirect } from "next/navigation";

import { getPopularMovies, getPopularTvShows } from "@/lib/api";
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

  const requestedPage = parseRawPageParam(params.page);
  if (requestedPage !== null && requestedPage > TMDB_MAX_PAGE) {
    redirect(buildPageHref(mediaType, TMDB_MAX_PAGE));
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
                <span className="font-semibold text-brand">{browsableCount}</span>{" "}
                popular{" "}
                {mediaLabelPlural === "movies"
                  ? `movie${browsableCount === 1 ? "" : "s"}`
                  : `TV show${browsableCount === 1 ? "" : "s"}`}
              </p>
              {paginationTotalPages > 1 && (
                <p className="text-sm text-muted">
                  Page {currentPage} of {paginationTotalPages}
                </p>
              )}
            </div>

            <PaginationNav
              currentPage={currentPage}
              totalPages={paginationTotalPages}
              buildHref={(p) => buildPageHref(mediaType, p)}
              ariaLabel={`Popular ${mediaLabelPlural} pagination (top)`}
              formAction="/"
              formFields={{ type: mediaType }}
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
              buildHref={(p) => buildPageHref(mediaType, p)}
              ariaLabel={`Popular ${mediaLabelPlural} pagination (bottom)`}
              formAction="/"
              formFields={{ type: mediaType }}
              placement="bottom"
            />
          </section>
        )}
      </div>
    </div>
  );
}
