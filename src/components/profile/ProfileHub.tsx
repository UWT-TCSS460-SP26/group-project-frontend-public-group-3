"use client";

import { Inter, Montserrat } from "next/font/google";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import type { ReviewMediaMeta } from "@/lib/profile-server";
import type { MyReviewResponse } from "@/lib/reviews-server";
import { normalizePosterUrl } from "@/lib/poster-url";
import PosterImage from "@/src/components/PosterImage";
import { isValidTmdbId } from "@/lib/tmdb-id";
import type { EnrichedRatingResponse, MediaType } from "@/lib/types";
import { SignInButton } from "@/src/components/AuthButtons";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import { buildDetailHref } from "@/src/components/MediaResultCard";
import { formatDisplayDate } from "@/src/lib/format-date";
import {
  getDisplayUsername,
  getRoleFromAccessToken,
} from "@/src/lib/profile-display";
import { useIsClient } from "@/src/lib/use-is-client";
import { deleteRatingAction, submitRatingAction } from "@/src/lib/rating-actions";
import {
  deleteReviewAction,
  saveReviewAction,
} from "@/src/lib/review-actions";
import { ui, mediaBadgeClass } from "@/src/lib/ui";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

type ProfileTab = "all" | "ratings" | "reviews";

type MediaMeta = {
  title: string;
  posterUrl: string | null;
};

type ActivityItem = {
  key: string;
  tmdbId: number | null;
  mediaType: MediaType;
  title: string;
  posterUrl: string | null;
  updatedAt: string;
  hasRating: boolean;
  hasReview: boolean;
  score?: number;
};

function movieMeta(
  review: MyReviewResponse,
  lookup: Map<string, MediaMeta>,
): MediaMeta {
  const cached = isValidTmdbId(review.tmdbId)
    ? lookup.get(`${review.mediaType}:${review.tmdbId}`)
    : undefined;

  const title =
    review.tmdb?.title ??
    cached?.title ??
    (isValidTmdbId(review.tmdbId) ? `Title #${review.tmdbId}` : "Unknown title");

  const posterUrl = normalizePosterUrl(
    review.tmdb?.posterUrl ?? cached?.posterUrl,
  );

  return { title, posterUrl };
}

/** Alias for movieMeta used in review list rows. */
function reviewMeta(
  review: MyReviewResponse,
  lookup: Map<string, MediaMeta>,
): MediaMeta {
  return movieMeta(review, lookup);
}

export type ProfileHubProps = {
  serverAuthenticated?: boolean;
  username?: string;
  sub?: string;
  role?: string;
  initialRatings?: EnrichedRatingResponse[];
  initialReviews?: MyReviewResponse[];
  reviewMetaLookup?: Record<string, ReviewMediaMeta>;
  initialLoadError?: string | null;
};

function metaLookupToMap(
  record: Record<string, ReviewMediaMeta>,
): Map<string, MediaMeta> {
  return new Map(Object.entries(record));
}

function ratingMeta(rating: EnrichedRatingResponse): MediaMeta {
  return {
    title: rating.tmdb?.title ?? `Title #${rating.tmdbId}`,
    posterUrl: normalizePosterUrl(rating.tmdb?.posterUrl),
  };
}

function mediaKey(mediaType: MediaType, tmdbId: number): string {
  return `${mediaType}:${tmdbId}`;
}

/** Merge ratings and reviews into a single recent-activity feed sorted by recency. */
function buildRecentActivity(
  ratings: EnrichedRatingResponse[],
  reviews: MyReviewResponse[],
  reviewLookup: Map<string, MediaMeta>,
): ActivityItem[] {
  const events: ActivityItem[] = [];

  for (const rating of ratings) {
    if (!isValidTmdbId(rating.tmdbId)) continue;
    const meta = ratingMeta(rating);
    events.push({
      key: `rating:${rating.id}`,
      tmdbId: rating.tmdbId,
      mediaType: rating.mediaType,
      title: meta.title,
      posterUrl: meta.posterUrl,
      updatedAt: rating.updatedAt,
      hasRating: true,
      hasReview: false,
      score: rating.score,
    });
  }

  for (const review of reviews) {
    const meta = movieMeta(review, reviewLookup);
    events.push({
      key: `review:${review.id}`,
      tmdbId: isValidTmdbId(review.tmdbId) ? review.tmdbId : null,
      mediaType: review.mediaType,
      title: meta.title,
      posterUrl: meta.posterUrl,
      updatedAt: review.updatedAt,
      hasRating: false,
      hasReview: true,
    });
  }

  const byKey = new Map<string, ActivityItem>();

  for (const event of events) {
    const mergeKey =
      event.tmdbId != null
        ? mediaKey(event.mediaType, event.tmdbId)
        : event.key;
    const existing = byKey.get(mergeKey);

    if (existing) {
      existing.hasRating = existing.hasRating || event.hasRating;
      existing.hasReview = existing.hasReview || event.hasReview;
      if (event.hasRating && event.score != null) {
        existing.score = event.score;
      }
      if (new Date(event.updatedAt) > new Date(existing.updatedAt)) {
        existing.updatedAt = event.updatedAt;
      }
      if (!existing.posterUrl && event.posterUrl) {
        existing.posterUrl = event.posterUrl;
      }
      if (
        existing.title.startsWith("Title #") &&
        !event.title.startsWith("Title #")
      ) {
        existing.title = event.title;
      }
    } else {
      byKey.set(mergeKey, { ...event, key: mergeKey });
    }
  }

  return [...byKey.values()]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 12);
}

function StatusMessage({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  const className =
    tone === "error"
      ? ui.alert
      : tone === "success"
        ? "rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-900"
        : "rounded-3xl border border-border bg-mint-soft px-5 py-3 text-sm text-brand";
  return (
    <p className={className} role="status" aria-live="polite">
      {children}
    </p>
  );
}

function PosterThumb({
  title,
  posterUrl,
  className = ui.poster,
}: {
  title: string;
  posterUrl: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <PosterImage
        src={posterUrl}
        alt={`${title} poster`}
        width={96}
        height={144}
        size="w185"
        sizes="96px"
      />
    </div>
  );
}

function RecentActivitySection({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted">
        No recent ratings or reviews yet. Explore titles and share your take.
      </p>
    );
  }

  return (
    <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scroll-smooth">
      {items.map((item) => {
        const detailHref = isValidTmdbId(item.tmdbId)
          ? buildDetailHref(item.mediaType, item.tmdbId)
          : null;
        const cardClass =
          "w-36 shrink-0 rounded-2xl border border-border bg-mint/80 p-3 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-mint/60";

        const cardInner = (
          <>
            <div className="mx-auto mb-2 h-44 w-28 overflow-hidden rounded-xl bg-mint-soft">
              <PosterImage
                src={item.posterUrl}
                alt={`${item.title} poster`}
                width={112}
                height={176}
                size="w185"
                sizes="112px"
              />
            </div>
            <p
              className={`line-clamp-2 text-center text-sm font-semibold text-brand ${montserrat.className}`}
            >
              {item.title}
            </p>
            <div className="mt-1 flex justify-center">
              <span className={mediaBadgeClass(item.mediaType)}>
                {item.mediaType}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {item.hasRating && (
                <span className="rounded-full bg-brand-bg px-2 py-0.5 text-xs font-medium text-white">
                  Rated {item.score}/10
                </span>
              )}
              {item.hasReview && (
                <span className="rounded-full bg-mint px-2 py-0.5 text-xs font-medium text-brand">
                  Reviewed
                </span>
              )}
            </div>
          </>
        );

        return detailHref ? (
          <Link key={item.key} href={detailHref} className={cardClass}>
            {cardInner}
          </Link>
        ) : (
          <div key={item.key} className={cardClass}>
            {cardInner}
          </div>
        );
      })}
    </div>
  );
}

function AccountInfoCard({
  username,
  sub,
  role,
}: {
  username: string;
  sub: string;
  role: string;
}) {
  const displayName = username.includes("@")
    ? username.split("@")[0]
    : username;

  return (
    <section className={ui.card} aria-labelledby="account-info-heading">
      <h2
        id="account-info-heading"
        className={`mb-4 text-lg font-semibold text-brand ${montserrat.className}`}
      >
        Account Info
      </h2>
      <dl className="grid gap-4 sm:grid-cols-3">
        <div className={ui.statBox}>
          <dt className={ui.label}>Username</dt>
          <dd className="mt-1 break-all text-sm font-medium text-brand">
            {displayName}
          </dd>
        </div>
        <div className={ui.statBox}>
          <dt className={ui.label}>Sub</dt>
          <dd className="mt-1 break-all text-sm font-medium text-brand">
            {sub}
          </dd>
        </div>
        <div className={ui.statBox}>
          <dt className={ui.label}>Role</dt>
          <dd className="mt-1 text-sm font-medium text-brand">{role}</dd>
        </div>
      </dl>
    </section>
  );
}

function RatingRow({
  rating,
  meta,
  canManage,
  onUpdated,
  onDeleted,
}: {
  rating: EnrichedRatingResponse;
  meta: MediaMeta;
  canManage: boolean;
  onUpdated: (rating: EnrichedRatingResponse) => void;
  onDeleted: (id: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [score, setScore] = useState(rating.score);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function saveRating() {
    setFeedback(null);
    setError(null);
    if (!Number.isInteger(score) || score < 1 || score > 10) {
      setError("Score must be an integer from 1 to 10.");
      return;
    }
    startTransition(async () => {
      setFeedback("Updating rating…");
      const result = await submitRatingAction(
        rating.tmdbId,
        rating.mediaType,
        score,
        rating.id,
      );
      if (!result.ok) {
        setError(result.error);
        setFeedback(null);
        return;
      }
      onUpdated({ ...rating, score: result.rating.score, updatedAt: result.rating.updatedAt });
      setIsEditing(false);
      setFeedback("Rating updated.");
    });
  }

  function removeRating() {
    if (!window.confirm("Delete this rating? This cannot be undone.")) return;
    setFeedback(null);
    setError(null);
    startTransition(async () => {
      setFeedback("Deleting rating…");
      const result = await deleteRatingAction(rating.id);
      if (!result.ok) {
        setError(result.error);
        setFeedback(null);
        return;
      }
      onDeleted(rating.id);
      setFeedback("Rating deleted.");
    });
  }

  const detailHref = isValidTmdbId(rating.tmdbId)
    ? buildDetailHref(rating.mediaType, rating.tmdbId)
    : null;

  return (
    <li className="rounded-2xl border border-border bg-mint-soft/60 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {detailHref ? (
          <Link
            href={detailHref}
            className="flex shrink-0 gap-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint/60"
          >
            <PosterThumb title={meta.title} posterUrl={meta.posterUrl} />
          </Link>
        ) : (
          <div className="shrink-0">
            <PosterThumb title={meta.title} posterUrl={meta.posterUrl} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {detailHref ? (
              <Link
                href={detailHref}
                className={`text-base font-semibold text-brand hover:underline ${montserrat.className}`}
              >
                {meta.title}
              </Link>
            ) : (
              <h3 className={`text-base font-semibold text-brand ${montserrat.className}`}>
                {meta.title}
              </h3>
            )}
            <span className={mediaBadgeClass(rating.mediaType)}>
              {rating.mediaType}
            </span>
          </div>
          <p className="text-sm text-muted">
            Score: <span className="font-semibold text-brand">{rating.score}/10</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Updated {formatDisplayDate(rating.updatedAt)}
          </p>

          {isEditing && canManage && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-brand" htmlFor={`rating-score-${rating.id}`}>
                New score
              </label>
              <input
                id={`rating-score-${rating.id}`}
                type="number"
                min={1}
                max={10}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className={ui.paginationJumpInput}
                disabled={isPending}
              />
              <button
                type="button"
                onClick={saveRating}
                disabled={isPending}
                className={ui.pillPrimary}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setScore(rating.score);
                  setError(null);
                }}
                disabled={isPending}
                className={ui.pillSecondary}
              >
                Cancel
              </button>
            </div>
          )}

          {canManage && (
            <div className="mt-4 flex flex-wrap gap-2">
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={isPending}
                  className={ui.pillSecondary}
                  aria-label={`Edit rating for ${meta.title}`}
                >
                  Edit Rating
                </button>
              )}
              <button
                type="button"
                onClick={removeRating}
                disabled={isPending}
                className={ui.pillSecondary}
                aria-label={`Delete rating for ${meta.title}`}
              >
                Delete Rating
              </button>
            </div>
          )}

          {feedback && <p className="mt-3 text-sm text-muted">{feedback}</p>}
          {error && (
            <p className="mt-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

function ReviewRow({
  review,
  meta,
  tmdbId,
  canManage,
  onUpdated,
  onDeleted,
}: {
  review: MyReviewResponse;
  meta: MediaMeta;
  tmdbId: number | null;
  canManage: boolean;
  onUpdated: (review: MyReviewResponse) => void;
  onDeleted: (id: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(review.title ?? "");
  const [body, setBody] = useState(review.body);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reviewTitle = review.title?.trim() ?? "";

  function saveReview() {
    setFeedback(null);
    setError(null);
    if (body.trim().length < 10) {
      setError("Review body must be at least 10 characters.");
      return;
    }
    startTransition(async () => {
      setFeedback("Updating review…");
      const result = await saveReviewAction(review.id, title, body.trim());
      if (!result.ok) {
        setError(result.error);
        setFeedback(null);
        return;
      }
      onUpdated({
        ...review,
        ...result.review,
        tmdbId: tmdbId ?? review.tmdbId,
        tmdb: review.tmdb,
      });
      setIsEditing(false);
      setFeedback("Review updated.");
    });
  }

  function removeReview() {
    if (!window.confirm("Delete this review? This cannot be undone.")) return;
    setFeedback(null);
    setError(null);
    startTransition(async () => {
      setFeedback("Deleting review…");
      const result = await deleteReviewAction(review.id);
      if (!result.ok) {
        setError(result.error);
        setFeedback(null);
        return;
      }
      onDeleted(review.id);
      setFeedback("Review deleted.");
    });
  }

  const detailHref =
    isValidTmdbId(tmdbId) ? buildDetailHref(review.mediaType, tmdbId) : null;
  const titleClass = `text-base font-semibold text-brand ${montserrat.className}`;

  return (
    <li className="rounded-2xl border border-border bg-mint-soft/60 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {detailHref ? (
          <Link
            href={detailHref}
            className="flex shrink-0 gap-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint/60"
          >
            <PosterThumb title={meta.title} posterUrl={meta.posterUrl} />
          </Link>
        ) : (
          <div className="shrink-0">
            <PosterThumb title={meta.title} posterUrl={meta.posterUrl} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {detailHref ? (
              <Link
                href={detailHref}
                className={`${titleClass} hover:underline`}
              >
                {meta.title}
              </Link>
            ) : (
              <h3 className={titleClass}>{meta.title}</h3>
            )}
            <span className={mediaBadgeClass(review.mediaType)}>
              {review.mediaType}
            </span>
          </div>

          {isEditing && canManage ? (
            <div className="mt-3 space-y-3">
              <div>
                <label
                  className={ui.label}
                  htmlFor={`review-title-${review.id}`}
                >
                  Title
                </label>
                <input
                  id={`review-title-${review.id}`}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`${ui.input} mt-1 w-full max-w-md rounded-2xl`}
                  disabled={isPending}
                />
              </div>
              <div>
                <label className={ui.label} htmlFor={`review-body-${review.id}`}>
                  Body
                </label>
                <textarea
                  id={`review-body-${review.id}`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="mt-1 w-full max-w-xl rounded-2xl border border-border bg-card px-4 py-3 text-sm text-brand outline-none focus:border-brand focus:ring-2 focus:ring-mint/50"
                  disabled={isPending}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveReview}
                  disabled={isPending}
                  className={ui.pillPrimary}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setTitle(review.title ?? "");
                    setBody(review.body);
                    setError(null);
                  }}
                  disabled={isPending}
                  className={ui.pillSecondary}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {reviewTitle && (
                <h3
                  className={`text-sm font-bold text-brand ${montserrat.className}`}
                >
                  {reviewTitle}
                </h3>
              )}
              <p
                className={`text-sm leading-relaxed text-prose ${reviewTitle ? "mt-2" : ""}`}
              >
                {review.body}
              </p>
            </>
          )}

          <p className="mt-2 text-xs text-muted">
            Updated {formatDisplayDate(review.updatedAt)}
          </p>

          {canManage && !isEditing && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isPending}
                className={ui.pillSecondary}
                aria-label={`Edit review for ${meta.title}`}
              >
                Edit Review
              </button>
              <button
                type="button"
                onClick={removeReview}
                disabled={isPending}
                className={ui.pillSecondary}
                aria-label={`Delete review for ${meta.title}`}
              >
                Delete Review
              </button>
            </div>
          )}

          {feedback && <p className="mt-3 text-sm text-muted">{feedback}</p>}
          {error && (
            <p className="mt-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

function ProfileAuthenticatedContent({
  username,
  sub,
  role,
  initialRatings,
  initialReviews,
  reviewMetaLookup: reviewMetaRecord,
  initialLoadError,
}: {
  username: string;
  sub: string;
  role: string;
  initialRatings: EnrichedRatingResponse[];
  initialReviews: MyReviewResponse[];
  reviewMetaLookup: Record<string, ReviewMediaMeta>;
  initialLoadError: string | null;
}) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("all");
  const [ratings, setRatings] = useState(initialRatings);
  const [reviews, setReviews] = useState(initialReviews);

  const reviewMetaLookup = useMemo(
    () => metaLookupToMap(reviewMetaRecord),
    [reviewMetaRecord],
  );

  const recentActivity = useMemo(
    () => buildRecentActivity(ratings, reviews, reviewMetaLookup),
    [ratings, reviews, reviewMetaLookup],
  );

  const showRatings = activeTab === "all" || activeTab === "ratings";
  const showReviews = activeTab === "all" || activeTab === "reviews";

  return (
    <>
      {initialLoadError && (
        <StatusMessage tone="error">{initialLoadError}</StatusMessage>
      )}

      <div className="space-y-10">
            <section className={ui.darkPanel} aria-labelledby="recent-activity-heading">
              <h2
                id="recent-activity-heading"
                className={`mb-4 text-lg font-semibold text-white ${montserrat.className}`}
              >
                Recent Activity
              </h2>
              <RecentActivitySection items={recentActivity} />
            </section>

            <AccountInfoCard username={username} sub={sub} role={role} />

            <nav
              className="flex flex-wrap gap-2"
              aria-label="Filter ratings and reviews"
            >
              {(
                [
                  ["all", "All"],
                  ["ratings", "Ratings"],
                  ["reviews", "Reviews"],
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={
                    activeTab === tab ? ui.tabActive : ui.tabInactive
                  }
                  aria-pressed={activeTab === tab}
                >
                  {label}
                  {tab === "ratings" && ` (${ratings.length})`}
                  {tab === "reviews" && ` (${reviews.length})`}
                </button>
              ))}
            </nav>

            {showRatings && (
              <section className={ui.card} aria-labelledby="ratings-heading">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2
                    id="ratings-heading"
                    className={`text-lg font-semibold text-brand ${montserrat.className}`}
                  >
                    Ratings
                  </h2>
                  <span className="text-sm text-muted">
                    {ratings.length} total
                  </span>
                </div>
                {ratings.length === 0 ? (
                  <p className="text-sm text-muted">
                    You have not rated any titles yet.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {ratings.map((rating) => (
                      <RatingRow
                        key={rating.id}
                        rating={rating}
                        meta={ratingMeta(rating)}
                        canManage
                        onUpdated={(updated) =>
                          setRatings((prev) =>
                            prev.map((r) =>
                              r.id === updated.id ? updated : r,
                            ),
                          )
                        }
                        onDeleted={(id) =>
                          setRatings((prev) => prev.filter((r) => r.id !== id))
                        }
                      />
                    ))}
                  </ul>
                )}
              </section>
            )}

            {showReviews && (
              <section className={ui.card} aria-labelledby="reviews-heading">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2
                    id="reviews-heading"
                    className={`text-lg font-semibold text-brand ${montserrat.className}`}
                  >
                    Reviews
                  </h2>
                  <span className="text-sm text-muted">
                    {reviews.length} total
                  </span>
                </div>
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted">
                    You have not written any reviews yet.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewRow
                        key={review.id}
                        review={review}
                        tmdbId={review.tmdbId ?? null}
                        meta={reviewMeta(review, reviewMetaLookup)}
                        canManage
                        onUpdated={(updated) =>
                          setReviews((prev) =>
                            prev.map((r) =>
                              r.id === updated.id ? updated : r,
                            ),
                          )
                        }
                        onDeleted={(id) =>
                          setReviews((prev) => prev.filter((r) => r.id !== id))
                        }
                      />
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
    </>
  );
}

function AuthenticatedProfileShell({
  username,
  sub,
  role,
  initialRatings,
  initialReviews,
  reviewMetaLookup,
  initialLoadError,
}: Required<
  Pick<
    ProfileHubProps,
    | "username"
    | "sub"
    | "role"
    | "initialRatings"
    | "initialReviews"
    | "reviewMetaLookup"
  >
> & {
  initialLoadError: string | null;
}) {
  const displayName = username.includes("@")
    ? username.split("@")[0]
    : username;

  return (
    <div className={`${ui.page} ${inter.className}`}>
      <div className={ui.container}>
        <header className="mb-10">
          <p className={ui.eyebrow}>Profile Hub</p>
          <h1 className={`${ui.title} ${montserrat.className}`}>
            Welcome back, {displayName}
          </h1>
          <p className={ui.subtitle}>
            Your ratings, reviews, and recent activity in one place.
          </p>
        </header>

        <ProfileAuthenticatedContent
          username={username}
          sub={sub}
          role={role}
          initialRatings={initialRatings}
          initialReviews={initialReviews}
          reviewMetaLookup={reviewMetaLookup}
          initialLoadError={initialLoadError}
        />
      </div>
    </div>
  );
}

export default function ProfileHub({
  serverAuthenticated = false,
  username: serverUsername,
  sub: serverSub,
  role: serverRole,
  initialRatings = [],
  initialReviews = [],
  reviewMetaLookup = {},
  initialLoadError = null,
}: ProfileHubProps = {}) {
  const isClient = useIsClient();
  const { data: session, status } = useSession();

  if (serverAuthenticated && serverUsername && serverSub && serverRole) {
    return (
      <AuthenticatedProfileShell
        username={serverUsername}
        sub={serverSub}
        role={serverRole}
        initialRatings={initialRatings}
        initialReviews={initialReviews}
        reviewMetaLookup={reviewMetaLookup}
        initialLoadError={initialLoadError}
      />
    );
  }

  const accessToken = session?.accessToken;
  const isAuthenticated =
    status === "authenticated" && Boolean(accessToken && session?.user);

  if (!isClient || status === "loading") {
    return (
      <div className={`${ui.page} ${inter.className}`}>
        <div className={ui.container}>
          <LoadingSpinner label="Loading your profile…" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !accessToken) {
    return (
      <div className={`${ui.page} ${inter.className}`}>
        <div className={ui.container}>
          <header className="mb-10">
            <p className={ui.eyebrow}>Profile Hub</p>
            <h1 className={`${ui.title} ${montserrat.className}`}>Profile</h1>
          </header>
          <section className={ui.emptyState}>
            <p className="mb-6 text-base text-muted">
              Sign in to view and manage your ratings and reviews.
            </p>
            <SignInButton callbackUrl="/profile" />
          </section>
        </div>
      </div>
    );
  }

  const clientUsername = getDisplayUsername(
    session.user?.name,
    session.user?.email,
    accessToken,
  );
  const clientSub = session.user?.id ?? "—";
  const clientRole = getRoleFromAccessToken(accessToken);

  return (
    <AuthenticatedProfileShell
      username={clientUsername}
      sub={clientSub}
      role={clientRole}
      initialRatings={initialRatings}
      initialReviews={initialReviews}
      reviewMetaLookup={reviewMetaLookup}
      initialLoadError={initialLoadError}
    />
  );
}
