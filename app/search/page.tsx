import { Inter, Montserrat } from "next/font/google";
import { searchMovies } from "@/lib/api";
import type { MediaListItem } from "@/lib/types";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

type SearchPageProps = {
  searchParams: Promise<{ title?: string; page?: string }>;
};

function buildSearchHref(title: string, page: number): string {
  const params = new URLSearchParams({
    title,
    page: String(page),
  });
  return `/search?${params.toString()}`;
}

function ResultCard({ item }: { item: MediaListItem }) {
  const yearLabel = item.year != null ? String(item.year) : "—";

  return (
    <article className="flex gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {item.posterUrl ? (
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
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const title = params.title?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const hasQuery = title.length > 0;

  let errorMessage: string | null = null;
  let results: MediaListItem[] = [];
  let totalResults = 0;
  let totalPages = 0;
  let currentPage = 1;

  if (hasQuery) {
    try {
      const data = await searchMovies(title, page);
      results = data.results;
      totalResults = data.totalResults;
      totalPages = data.totalPages;
      currentPage = data.page;
    } catch (err) {
      errorMessage =
        err instanceof Error ? err.message : "Something went wrong. Try again.";
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
            Movie Search
          </h1>
          <p className="mt-2 max-w-xl text-slate-600">
            Find movies by title. Results come from the partner catalog API.
          </p>
        </header>

        <section className="mb-10 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <form action="/search" method="get" className="flex flex-col gap-4 sm:flex-row">
            <label className="sr-only" htmlFor="search-title">
              Movie title
            </label>
            <input
              id="search-title"
              name="title"
              type="search"
              defaultValue={title}
              placeholder="e.g. Fight Club"
              required
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-[#0f1f3d] outline-none transition-colors placeholder:text-slate-400 focus:border-[#5b4bb7] focus:bg-white focus:ring-2 focus:ring-[#5b4bb7]/20"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#0f1f3d] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1a335c] focus:outline-none focus:ring-2 focus:ring-[#5b4bb7]/40 focus:ring-offset-2"
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
              Search failed
            </p>
            <p className="mt-1 text-sm">{errorMessage}</p>
          </section>
        )}

        {hasQuery && !errorMessage && results.length === 0 && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <p
              className={`text-lg font-semibold text-[#0f1f3d] ${montserrat.className}`}
            >
              No movies found
            </p>
            <p className="mt-2 text-sm text-slate-500">
              No results for &ldquo;{title}&rdquo;. Try a different title.
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
                result{totalResults === 1 ? "" : "s"} for &ldquo;{title}&rdquo;
              </p>
              {totalPages > 1 && (
                <p className="text-sm text-slate-500">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>

            <ul className="grid gap-4 sm:grid-cols-1">
              {results.map((item) => (
                <li key={item.id}>
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
                    href={buildSearchHref(title, currentPage - 1)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0f1f3d] shadow-sm transition-colors hover:border-[#5b4bb7]/40 hover:text-[#5b4bb7]"
                  >
                    Previous
                  </a>
                ) : (
                  <span />
                )}
                {currentPage < totalPages ? (
                  <a
                    href={buildSearchHref(title, currentPage + 1)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0f1f3d] shadow-sm transition-colors hover:border-[#5b4bb7]/40 hover:text-[#5b4bb7]"
                  >
                    Next
                  </a>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </section>
        )}

        {!hasQuery && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center">
            <p className="text-sm text-slate-500">
              Enter a movie title and press Search to see results.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
