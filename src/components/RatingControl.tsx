"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { deleteRatingAction, submitRatingAction } from "@/src/lib/rating-actions";
import type { MediaType } from "@/lib/types";
import { AUTH_PROVIDER_ID } from "@/src/lib/auth-urls";

const STAR_COUNT = 10;

type UserRating = {
  id: number;
  score: number;
};

type StoredUserRating = {
  id: number | null;
  score: number;
};

function readStoredRating(storageKey: string): StoredUserRating | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredUserRating;
    if (
      Number.isInteger(parsed.score) &&
      parsed.score >= 1 &&
      parsed.score <= STAR_COUNT
    ) {
      return {
        score: parsed.score,
        id:
          parsed.id != null && Number.isInteger(parsed.id) ? parsed.id : null,
      };
    }
  } catch {
    // Ignore malformed local data.
  }

  return null;
}

type RatingControlProps = {
  tmdbId: number;
  mediaType: MediaType;
  isSignedIn: boolean;
  signInCallbackUrl: string;
  initialRating: UserRating | null;
};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-8 w-8 transition-colors ${
        filled ? "fill-brand text-brand" : "fill-none text-border"
      }`}
    >
      <path
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.5}
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
      />
    </svg>
  );
}

export default function RatingControl({
  tmdbId,
  mediaType,
  isSignedIn,
  signInCallbackUrl,
  initialRating,
}: RatingControlProps) {
  const router = useRouter();
  const storageKey = `rating:${mediaType}:${tmdbId}`;
  const [isPending, startTransition] = useTransition();
  const [score, setScore] = useState(() => {
    if (initialRating) {
      return initialRating.score;
    }
    return readStoredRating(storageKey)?.score ?? 0;
  });
  const [ratingId, setRatingId] = useState<number | null>(() => {
    if (initialRating) {
      return initialRating.id;
    }
    return readStoredRating(storageKey)?.id ?? null;
  });
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !initialRating) {
      return;
    }

    const current: StoredUserRating = {
      id: initialRating.id,
      score: initialRating.score,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(current));
  }, [initialRating, isSignedIn, storageKey]);

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-mint-soft/80 px-4 py-3 text-center">
        <button
          type="button"
          onClick={() => signIn(AUTH_PROVIDER_ID, { callbackUrl: signInCallbackUrl })}
          className="cursor-pointer text-sm font-semibold text-brand underline-offset-2 hover:underline"
        >
          Sign in to rate
        </button>
      </div>
    );
  }

  function handleSelect(nextScore: number) {
    setError(null);
    setSavedMessage(null);
    setScore(nextScore);

    startTransition(async () => {
      const result = await submitRatingAction(
        tmdbId,
        mediaType,
        nextScore,
        ratingId,
      );

      if (!result.ok) {
        setError(result.error);
        setScore(initialRating?.score ?? 0);
        return;
      }

      setRatingId(result.rating.id);
      setScore(result.rating.score);
      const saved: StoredUserRating = {
        id: result.rating.id,
        score: result.rating.score,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(saved));
      setSavedMessage(
        ratingId == null ? "Rating saved." : "Rating updated.",
      );
      router.refresh();
    });
  }

  function handleDelete() {
    if (ratingId == null) {
      setScore(0);
      window.localStorage.removeItem(storageKey);
      setSavedMessage("Rating cleared.");
      return;
    }
    setError(null);
    setSavedMessage(null);
    startTransition(async () => {
      const result = await deleteRatingAction(ratingId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRatingId(null);
      setScore(0);
      window.localStorage.removeItem(storageKey);
      setSavedMessage("Rating deleted.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-mint-soft/80 px-4 py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-brand">Your rating</p>
        <div className="flex items-center gap-2">
          {score > 0 && (
            <p className="text-xs font-semibold text-muted">
              {score} / {STAR_COUNT}
            </p>
          )}
          {(score > 0 || ratingId != null) && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
            >
              Delete rating
            </button>
          )}
        </div>
      </div>
      {score > 0 && (
        <p className="mb-2 text-xs text-muted">
          You rated this title {score} out of {STAR_COUNT}.
        </p>
      )}

      <div
        className="flex flex-wrap gap-0.5"
        role="group"
        aria-label={`Your rating from 1 to ${STAR_COUNT}`}
      >
        {Array.from({ length: STAR_COUNT }, (_, index) => {
          const starValue = index + 1;
          const filled = starValue <= score;

          return (
            <button
              key={starValue}
              type="button"
              disabled={isPending}
              onClick={() => handleSelect(starValue)}
              className="rounded-md p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-mint/60 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`${starValue} out of ${STAR_COUNT}`}
              aria-pressed={filled}
            >
              <StarIcon filled={filled} />
            </button>
          );
        })}
      </div>

      {isPending && (
        <p className="mt-2 text-xs text-muted" role="status">
          Saving…
        </p>
      )}
      {savedMessage && !isPending && (
        <p className="mt-2 text-xs font-medium text-brand" role="status">
          {savedMessage}
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
