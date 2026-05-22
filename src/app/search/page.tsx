import { Inter, Montserrat } from "next/font/google";
import { searchMovies, searchTvShows } from "@/lib/api";
import type { MediaListItem, MediaType } from "@/lib/types";

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

function buildDetailHref(type: MediaType, id: number): string {
  const params = new URLSearchParams({
    type,
    id: String(id),
  });
  return `/details?${params.toString()}`;
}

function ResultCard({ item }: { item: MediaListItem }) {
  const yearLabel = item.year != null ? String(item.year) : "—";

  return (
    <a
      href={buildDetailHref(item.mediaType, item.id)}
      className="block rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:border-[#5b4bb7]/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#5b4bb7]/30"
    >
      <article className="flex gap-4">
      <div className="h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {item.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- TMDB posters; avoids next.config remotePatterns
          <img
            src={item.posterUrl}
            alt={`${item.title} poster`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-slate-400">
            No poster
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h2
            className={`text-lg font-semibold text-[#0f1f3d] ${montserrat.className}`}
          >
            {item.title}
          </h2>
          <span className="rounded-full bg-[#5b4bb7]/10 px-2.5 py-0.5 text-xs font-medium capitalize text-[#5b4bb7]">
            {item.mediaType}
          </span>
        </div>
        <p className="mb-2 text-sm text-slate-500">{yearLabel}</p>
        <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
          {item.overview}
        </p>
      </div>
      </article>
    </a>
  );
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
    <div
      className={`min-h-screen bg-slate-50 text-slate-800 ${inter.className}`}
    >
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-[#5b4bb7]">
            Discover
          </p>
          <h1
            className={`text-3xl font-bold tracking-tight text-[#0f1f3d] sm:text-4xl ${montserrat.className}`}
          >
            Search
          </h1>
          <p className="mt-2 max-w-xl text-slate-600">
            Find movies and TV shows by title.
          </p>
        </header>

        <section className="mb-10 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <form
            action="/search"
            method="get"
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
              <div className="flex flex-col gap-2 sm:w-40">
                <label
                  htmlFor="search-type"
                  className="text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Type
                </label>
                <select
                  id="search-type"
                  name="type"
                  defaultValue={mediaType}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-[#0f1f3d] outline-none transition-colors focus:border-[#5b4bb7] focus:bg-white focus:ring-2 focus:ring-[#5b4bb7]/20"
                >
                  <option value="movie">Movies</option>
                  <option value="show">TV Shows</option>
                </select>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <label
                  htmlFor="search-title"
                  className="text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Title
                </label>
                <input
                  id="search-title"
                  name="title"
                  type="search"
                  defaultValue={title}
                  placeholder={
                    isMovie ? "e.g. Fight Club" : "e.g. The Office"
                  }
                  required
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-[#0f1f3d] outline-none transition-colors placeholder:text-slate-400 focus:border-[#5b4bb7] focus:bg-white focus:ring-2 focus:ring-[#5b4bb7]/20"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#0f1f3d] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1a335c] focus:outline-none focus:ring-2 focus:ring-[#5b4bb7]/40 focus:ring-offset-2 sm:w-auto sm:self-end"
            >
              Search
            </button>
          </form>
        </section>

        {hasQuery && errorMessage && (
          <section
            role="alert"
            className="mb-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-800"
          >
            <p className={`font-semibold ${montserrat.className}`}>
              Could not search {mediaLabelPlural}
            </p>
            <p className="mt-1 text-sm">{errorMessage}</p>
          </section>
        )}

        {hasQuery && !errorMessage && results.length === 0 && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <p
              className={`text-lg font-semibold text-[#0f1f3d] ${montserrat.className}`}
            >
              No {mediaLabelPlural} found
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Nothing matched &ldquo;{title}&rdquo; in {mediaLabelPlural}. Try
              another title or switch the type above.
            </p>
          </section>
        )}

        {hasQuery && !errorMessage && results.length > 0 && (
          <section>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-[#0f1f3d]">
                  {totalResults}
                </span>{" "}
                {mediaLabel}
                {totalResults === 1 ? "" : "s"} for &ldquo;{title}&rdquo;
              </p>
              {totalPages > 1 && (
                <p className="text-sm text-slate-500">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>

            <ul className="grid gap-4">
              {results.map((item) => (
                <li key={`${item.mediaType}-${item.id}`}>
                  <ResultCard item={item} />
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <nav
                className="mt-8 flex items-center justify-between gap-4 border-t border-slate-200 pt-6"
                aria-label="Search results pagination"
              >
                {currentPage > 1 ? (
                  <a
                    href={buildSearchHref(mediaType, title, currentPage - 1)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0f1f3d] shadow-sm transition-colors hover:border-[#5b4bb7]/40 hover:text-[#5b4bb7]"
                  >
                    Previous
                  </a>
                ) : (
                  <span aria-hidden="true" />
                )}
                {currentPage < totalPages ? (
                  <a
                    href={buildSearchHref(mediaType, title, currentPage + 1)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0f1f3d] shadow-sm transition-colors hover:border-[#5b4bb7]/40 hover:text-[#5b4bb7]"
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
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center">
            <p className="text-sm text-slate-500">
              Choose Movies or TV Shows, enter a title, and press Search.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
