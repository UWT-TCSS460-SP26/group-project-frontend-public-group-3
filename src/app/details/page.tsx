import { Inter, Montserrat } from "next/font/google";
import { notFound } from "next/navigation";
import { ApiRequestError, getMovieDetail, getShowDetail, getPopularMovies, getPopularTvShows } from "@/lib/api";
import type {
  CommunitySummary,
  MediaDetailResponse,
  MediaType,
  ReviewResponse,
} from "@/lib/types";
import { isMovieDetail } from "@/lib/types";
import DetailsUserControls from "@/src/components/DetailsUserControls";
import PosterImage from "@/src/components/PosterImage";
import { formatDisplayDate } from "@/src/lib/format-date";
import { ui, mediaBadgeClass } from "@/src/lib/ui";

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
  if (year == null) {
    return "—";
  }
  return String(year);
}

function formatScore(score: number | null): string {
  if (score == null) {
    return "—";
  }
  return score.toFixed(1);
}

function ReviewCard({ review }: Readonly<{ review: ReviewResponse }>) {
  const heading = review.title?.trim() || "Review";

  return (
    <article className="rounded-xl border border-border bg-mint-soft/80 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3
          className={`text-sm font-bold text-brand drop-shadow-[0_1px_1px_rgba(15,31,61,0.18)] ${montserrat.className}`}
        >
          {heading}
        </h3>
        <time
          dateTime={review.createdAt}
          className="text-xs text-muted"
        >
          {formatDisplayDate(review.createdAt)}
        </time>
      </div>
      <p className="mb-2 text-xs font-medium text-brand">
        {review.author.username}
      </p>
      <p className="text-sm leading-relaxed text-prose">{review.body}</p>
    </article>
  );
}

function CommunitySection({ community }: Readonly<{ community: CommunitySummary }>) {
  const hasRatings = community.ratingCount > 0;
  const hasReviews = community.recentReviews.length > 0;

  return (
    <section className={`${ui.darkPanel} mb-8`}>
      <h2
        className={`mb-4 text-lg font-semibold text-white ${montserrat.className}`}
      >
        Community
      </h2>

      <dl className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-mint-soft px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Average score
          </dt>
          <dd className="mt-1 text-2xl font-bold text-brand">
            {hasRatings ? formatScore(community.averageScore) : "—"}
          </dd>
        </div>
        <div className="rounded-xl bg-mint-soft px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Ratings
          </dt>
          <dd className="mt-1 text-2xl font-bold text-brand">
            {community.ratingCount}
          </dd>
        </div>
        <div className="rounded-xl bg-mint-soft px-4 py-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Reviews
          </dt>
          <dd className="mt-1 text-2xl font-bold text-brand">
            {community.reviewCount}
          </dd>
        </div>
      </dl>

      {hasReviews ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mint/90">
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
        <p className="text-sm text-mint/80">
          No community reviews yet. Be the first to share your thoughts after
          signing in.
        </p>
      )}
    </section>
  );
}

function DetailContent({
  detail,
  mediaType,
  signInCallbackUrl,
}: Readonly<{
  detail: MediaDetailResponse;
  mediaType: DetailMediaType;
  signInCallbackUrl: string;
}>) {
  const isMovie = isMovieDetail(detail);
  const mediaLabel = isMovie ? "movie" : "TV show";

  return (
    <>
      <section className={`mb-8 overflow-hidden ${ui.card}`}>
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:gap-8">
          <div className="mx-auto h-72 w-48 shrink-0 overflow-hidden rounded-xl bg-mint-soft sm:mx-0">
            <PosterImage
              src={detail.posterUrl}
              alt={`${detail.title} poster`}
              width={192}
              height={288}
              size="w342"
              priority
              sizes="192px"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={mediaBadgeClass(isMovie ? "movie" : "show")}>
                {mediaLabel}
              </span>
              {detail.status && (
                <span className={ui.badgeMuted}>
                  {detail.status}
                </span>
              )}
            </div>

            <p className="mb-4 text-sm text-muted">
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
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  {isMovie ? "Runtime" : "Seasons"}
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-brand">
                  {isMovie
                    ? formatRuntime(detail.runtimeMinutes)
                    : detail.seasonCount}
                </dd>
              </div>
              {!isMovie && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                    Episodes
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-brand">
                    {detail.episodeCount}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  TMDB rating
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-brand">
                  {detail.rating.toFixed(1)} / 10
                </dd>
              </div>
            </dl>

            <DetailsUserControls
              tmdbId={detail.id}
              mediaType={mediaType}
              signInCallbackUrl={signInCallbackUrl}
            />
          </div>
        </div>
      </section>

      <section className={`mb-8 ${ui.card}`}>
        <h2
          className={`mb-3 text-lg font-semibold text-brand ${montserrat.className}`}
        >
          Synopsis
        </h2>
        <p className="text-sm leading-relaxed text-prose">
          {detail.overview?.trim() || "No synopsis available."}
        </p>
      </section>

      <CommunitySection community={detail.community} />
    </>
  );
}

async function fetchRecommendations(
  detail: MediaDetailResponse,
  isMovie: boolean,
  limit = 6,
) {
  try {
    const data = isMovie ? await getPopularMovies(1) : await getPopularTvShows(1);
    const recs = data.results.filter((r) => r.id !== detail.id).slice(0, limit);
    return recs;
  } catch {
    return [];
  }
}

function RecommendationSection({ items }: Readonly<{ items: { id: number; title: string; posterUrl: string | null; mediaType: string }[] }>) {
  if (!items || items.length === 0) {
    return null;
  }
  return (
    <section className={`mb-8 ${ui.card}`}>
      <h2 className={`mb-3 text-lg font-semibold text-brand ${montserrat.className}`}>
        You might also like
      </h2>
      <ul className="grid gap-5 sm:grid-cols-3">
        {items.map((it) => (
          <li key={`${it.mediaType}-${it.id}`} className="transform transition hover:scale-105 duration-200">
            <a href={`/details?type=${it.mediaType}&id=${it.id}`} className="block">
              <div className="h-40 w-full overflow-hidden rounded-md bg-mint-soft">
                <PosterImage
                  src={it.posterUrl}
                  alt={`${it.title} poster`}
                  width={342}
                  height={513}
                  size="w342"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <p className="mt-2 text-sm font-medium text-prose">{it.title}</p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function DetailsPage({ searchParams }: Readonly<DetailsPageProps>) {
  const params = await searchParams;
  const mediaType = parseMediaType(params.type);
  const id = parseId(params.id);
  const mediaLabel = mediaType === "movie" ? "movie" : "TV show";

  if (id == null) {
    return (
      <div className={`${ui.page} ${inter.className}`}>
        <div className={ui.container}>
          <header className="mb-12">
            <p className={ui.eyebrow}>Discover</p>
            <h1 className={`${ui.title} ${montserrat.className}`}>Details</h1>
          </header>
          <section className={ui.emptyState}>
            <p className={`text-lg font-semibold text-brand ${montserrat.className}`}>
              Invalid {mediaLabel} link
            </p>
            <p className="mt-2 text-sm text-muted">
              Open a title from search or browse to view its details.
            </p>
            <a href="/search" className={`mt-6 inline-block ${ui.pillSecondary}`}>
              Back to search
            </a>
          </section>
        </div>
      </div>
    );
  }

  const validId = id;
  const signInCallbackUrl = `/details?type=${mediaType}&id=${validId}`;

  let detail: MediaDetailResponse | null = null;
  let errorMessage: string | null = null;

  try {
    detail =
      mediaType === "movie"
        ? await getMovieDetail(validId)
        : await getShowDetail(validId);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) {
      notFound();
    }
    errorMessage =
      err instanceof Error
        ? err.message
        : "We could not load this title. Please try again.";
  }

  let recommendations: { id: number; title: string; posterUrl: string | null; mediaType: string }[] = [];
  if (detail) {
    const recs = await fetchRecommendations(detail, mediaType === "movie");
    recommendations = recs.map((r) => ({
      id: r.id,
      title: r.title,
      posterUrl: r.posterUrl,
      mediaType: r.mediaType,
    }));
  }

  return (
    <div
      className={`${ui.page} ${inter.className}`}
    >
      <div className={ui.container}>
        <header className="mb-12">
          <p className={ui.eyebrow}>Discover</p>
          <h1 className={`${ui.title} ${montserrat.className}`}>
            {detail?.title ?? "Details"}
          </h1>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted">
              {mediaType === "movie" ? "Movie" : "TV show"}
              {detail ? ` · TMDB #${detail.id}` : ""}
            </p>
            <a href="/search" className={ui.pillSecondary}>
              Back to search
            </a>
          </div>
        </header>

        {errorMessage && (
          <section role="alert" className={`mb-8 ${ui.alert}`}>
            <p className={`font-semibold ${montserrat.className}`}>
              Could not load {mediaLabel}
            </p>
            <p className="mt-1 text-sm">{errorMessage}</p>
          </section>
        )}

        {detail && (
          <>
            <DetailContent
              detail={detail}
              mediaType={mediaType}
              signInCallbackUrl={signInCallbackUrl}
            />
            <RecommendationSection items={recommendations} />
          </>
        )}
      </div>
    </div>
  );
}
