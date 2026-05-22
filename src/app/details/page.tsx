import { Inter, Montserrat } from "next/font/google";
import { notFound } from "next/navigation";
import { ApiRequestError, getMovieDetail, getShowDetail } from "@/lib/api";
import type {
  CommunitySummary,
  MediaDetailResponse,
  MediaType,
  ReviewResponse,
} from "@/lib/types";
import { isMovieDetail } from "@/lib/types";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

type DetailMediaType = Extract<MediaType, "movie" | "show">;

type DetailsPageProps = {
  searchParams: Promise<{ type?: string; id?: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function parseMediaType(value: string | undefined): DetailMediaType {
  return value === "show" ? "show" : "movie";
}

function parseId(value: string | undefined): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    return null;
  }
  return id;
}

function formatRuntime(minutes: number | null): string {
  if (minutes == null || minutes <= 0) {
    return "—";
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

function formatYear(year: number | null): string {
  return year != null ? String(year) : "—";
}

function formatScore(score: number | null): string {
  return score != null ? score.toFixed(1) : "—";
}

function ReviewCard({ review }: { review: ReviewResponse }) {
  const heading = review.title?.trim() || "Review";

  return (
    <article className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3
          className={`text-sm font-semibold text-[#0f1f3d] ${montserrat.className}`}
        >
          {heading}
        </h3>
        <time
          dateTime={review.createdAt}
          className="text-xs text-slate-500"
        >
          {dateFormatter.format(new Date(review.createdAt))}
        </time>
      </div>
      <p className="mb-2 text-xs font-medium text-[#5b4bb7]">
        {review.author.username}
      </p>
      <p className="text-sm leading-relaxed text-slate-600">{review.body}</p>
    </article>
  );
}

function CommunitySection({ community }: { community: CommunitySummary }) {
  const hasRatings = community.ratingCount > 0;
  const hasReviews = community.recentReviews.length > 0;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h2
        className={`mb-4 text-lg font-semibold text-[#0f1f3d] ${montserrat.className}`}
      >
        Community
      </h2>

      <dl className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Average score
          </dt>
          <dd className="mt-1 text-2xl font-bold text-[#0f1f3d]">
            {hasRatings ? formatScore(community.averageScore) : "—"}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Ratings
          </dt>
          <dd className="mt-1 text-2xl font-bold text-[#0f1f3d]">
            {community.ratingCount}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Reviews
          </dt>
          <dd className="mt-1 text-2xl font-bold text-[#0f1f3d]">
            {community.reviewCount}
          </dd>
        </div>
      </dl>

      {hasReviews ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recent reviews
          </h3>
          <ul className="grid gap-3">
            {community.recentReviews.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          No community reviews yet. Be the first to share your thoughts after
          signing in.
        </p>
      )}
    </section>
  );
}

function DetailContent({ detail }: { detail: MediaDetailResponse }) {
  const isMovie = isMovieDetail(detail);
  const mediaLabel = isMovie ? "movie" : "TV show";

  return (
    <>
      <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:gap-8">
          <div className="mx-auto h-72 w-48 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:mx-0">
            {detail.posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- TMDB posters; avoids next.config remotePatterns
              <img
                src={detail.posterUrl}
                alt={`${detail.title} poster`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-slate-400">
                No poster
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#5b4bb7]/10 px-2.5 py-0.5 text-xs font-medium capitalize text-[#5b4bb7]">
                {mediaLabel}
              </span>
              {detail.status && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {detail.status}
                </span>
              )}
            </div>

            <p className="mb-4 text-sm text-slate-500">
              Released {formatYear(detail.year)}
              {detail.genres.length > 0 && (
                <>
                  {" "}
                  · {detail.genres.join(", ")}
                </>
              )}
            </p>

            <dl className="mb-6 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {isMovie ? "Runtime" : "Seasons"}
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-[#0f1f3d]">
                  {isMovie
                    ? formatRuntime(detail.runtimeMinutes)
                    : detail.seasonCount}
                </dd>
              </div>
              {!isMovie && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Episodes
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-[#0f1f3d]">
                    {detail.episodeCount}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  TMDB rating
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-[#0f1f3d]">
                  {detail.rating.toFixed(1)} / 10
                </dd>
              </div>
            </dl>

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-3">
              <p className="text-sm font-medium text-slate-600">
                Sign in to rate
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Rating and review actions arrive in a later sprint.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2
          className={`mb-3 text-lg font-semibold text-[#0f1f3d] ${montserrat.className}`}
        >
          Synopsis
        </h2>
        <p className="text-sm leading-relaxed text-slate-600">
          {detail.overview?.trim() || "No synopsis available."}
        </p>
      </section>

      <CommunitySection community={detail.community} />
    </>
  );
}

export default async function DetailsPage({ searchParams }: DetailsPageProps) {
  const params = await searchParams;
  const mediaType = parseMediaType(params.type);
  const id = parseId(params.id);
  const mediaLabel = mediaType === "movie" ? "movie" : "TV show";

  if (id == null) {
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
              Details
            </h1>
          </header>
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
            <p
              className={`text-lg font-semibold text-[#0f1f3d] ${montserrat.className}`}
            >
              Invalid {mediaLabel} link
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Open a title from search or browse to view its details.
            </p>
            <a
              href="/search"
              className="mt-6 inline-block rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0f1f3d] shadow-sm transition-colors hover:border-[#5b4bb7]/40 hover:text-[#5b4bb7]"
            >
              Back to search
            </a>
          </section>
        </div>
      </div>
    );
  }

  let detail: MediaDetailResponse | null = null;
  let errorMessage: string | null = null;

  try {
    detail =
      mediaType === "movie"
        ? await getMovieDetail(id)
        : await getShowDetail(id);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) {
      notFound();
    }
    errorMessage =
      err instanceof Error
        ? err.message
        : "We could not load this title. Please try again.";
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
            {detail?.title ?? "Details"}
          </h1>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              {mediaType === "movie" ? "Movie" : "TV show"}
              {detail ? ` · TMDB #${detail.id}` : ""}
            </p>
            <a
              href="/search"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0f1f3d] shadow-sm transition-colors hover:border-[#5b4bb7]/40 hover:text-[#5b4bb7]"
            >
              Back to search
            </a>
          </div>
        </header>

        {errorMessage && (
          <section
            role="alert"
            className="mb-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-800"
          >
            <p className={`font-semibold ${montserrat.className}`}>
              Could not load {mediaLabel}
            </p>
            <p className="mt-1 text-sm">{errorMessage}</p>
          </section>
        )}

        {detail && <DetailContent detail={detail} />}
      </div>
    </div>
  );
}
