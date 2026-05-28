"use client";

import { signIn } from "next-auth/react";
import { useMemo, useState, useTransition } from "react";
import type { MediaType } from "@/lib/types";
import { AUTH_PROVIDER_ID } from "@/src/lib/auth-urls";
import { deleteReviewAction, upsertReviewAction } from "@/src/lib/review-actions";

type ExistingReview = {
  id: number;
  title: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type ReviewControlProps = {
  tmdbId: number;
  mediaType: MediaType;
  isSignedIn: boolean;
  signInCallbackUrl: string;
  existingReview: ExistingReview | null;
};

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function ReviewControl({
  tmdbId,
  mediaType,
  isSignedIn,
  signInCallbackUrl,
  existingReview,
}: ReviewControlProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [review, setReview] = useState(existingReview);
  const [title, setTitle] = useState(existingReview?.title ?? "");
  const [body, setBody] = useState(existingReview?.body ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => body.trim().length >= 10, [body]);

  function startEdit() {
    setIsEditing(true);
    setMessage(null);
    setError(null);
    setTitle(review?.title ?? "");
    setBody(review?.body ?? "");
  }

  function cancelEdit() {
    setIsEditing(false);
    setTitle(review?.title ?? "");
    setBody(review?.body ?? "");
    setError(null);
  }

  function submitReview() {
    setMessage(null);
    setError(null);
    if (!canSubmit) {
      setError("Review body must be at least 10 characters.");
      return;
    }

    startTransition(async () => {
      const result = await upsertReviewAction(
        tmdbId,
        mediaType,
        review?.id ?? null,
        title,
        body.trim(),
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReview(result.review);
      setTitle(result.review.title ?? "");
      setBody(result.review.body);
      setIsEditing(false);
      setMessage(review ? "Review updated." : "Review created.");
    });
  }

  function removeReview() {
    if (!review) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await deleteReviewAction(review.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReview(null);
      setTitle("");
      setBody("");
      setIsEditing(false);
      setMessage("Review deleted.");
    });
  }

  if (!isSignedIn) {
    return (
      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => signIn(AUTH_PROVIDER_ID, { callbackUrl: signInCallbackUrl })}
          className="rounded-md border border-border bg-mint px-3 py-2 text-sm font-semibold text-brand transition-colors hover:bg-mint/80"
        >
          Write a review
        </button>
        <p className="mt-2 text-xs text-muted">
          You can only write reviews when signed in.
        </p>
      </section>
    );
  }

  if (!review && !isEditing) {
    return (
      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-md border border-border bg-mint px-3 py-2 text-sm font-semibold text-brand transition-colors hover:bg-mint/80"
        >
          Write a review
        </button>
        {message && <p className="mt-2 text-xs text-brand">{message}</p>}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      {!isEditing && review ? (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-brand">Your review</h3>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border border-border bg-mint px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-mint/80"
                onClick={startEdit}
              >
                Edit review
              </button>
              <button
                type="button"
                className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                onClick={removeReview}
                disabled={isPending}
              >
                Delete review
              </button>
            </div>
          </div>
          {review.title && (
            <p className="text-base font-bold text-brand drop-shadow-[0_1px_1px_rgba(15,31,61,0.18)]">
              {review.title}
            </p>
          )}
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{review.body}</p>
          <p className="mt-3 text-xs text-muted">
            Created {timeFormatter.format(new Date(review.createdAt))} · Updated{" "}
            {timeFormatter.format(new Date(review.updatedAt))}
          </p>
        </div>
      ) : (
        <div>
          <p className="mb-2 text-sm font-semibold text-brand">
            {review ? "Edit review" : "Write a review"}
          </p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="Optional title"
            className="mb-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-brand outline-none focus:border-brand"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            minLength={10}
            maxLength={5000}
            placeholder="Share your thoughts (10+ characters)"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-brand outline-none focus:border-brand"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-border bg-mint px-3 py-2 text-sm font-semibold text-brand transition-colors hover:bg-mint/80 disabled:opacity-60"
              onClick={submitReview}
              disabled={isPending || !canSubmit}
            >
              {review ? "Save changes" : "Post review"}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-mint-soft"
              onClick={cancelEdit}
              disabled={isPending}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isPending && <p className="mt-2 text-xs text-muted">Saving…</p>}
      {message && <p className="mt-2 text-xs text-brand">{message}</p>}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </section>
  );
}
