"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import type { MediaType } from "@/lib/types";
import RatingControl from "@/src/components/RatingControl";
import ReviewControl from "@/src/components/ReviewControl";
import { getMyRatingAction } from "@/src/lib/rating-actions";
import { getMyReviewAction } from "@/src/lib/review-actions";

type UserRatingState = {
  id: number;
  score: number;
};

type UserReviewState = {
  id: number;
  title: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type DetailsUserControlsProps = {
  tmdbId: number;
  mediaType: MediaType;
  signInCallbackUrl: string;
};

export default function DetailsUserControls({
  tmdbId,
  mediaType,
  signInCallbackUrl,
}: DetailsUserControlsProps) {
  const { data: session, status } = useSession();
  const isSignedIn = Boolean(session?.accessToken);
  const [userRating, setUserRating] = useState<UserRatingState | null>(null);
  const [userReview, setUserReview] = useState<UserReviewState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!isSignedIn) {
      setUserRating(null);
      setUserReview(null);
      setLoaded(true);
      return;
    }

    let cancelled = false;

    async function loadUserContent() {
      const [ratingResult, reviewResult] = await Promise.all([
        getMyRatingAction(tmdbId, mediaType),
        getMyReviewAction(tmdbId, mediaType),
      ]);

      if (cancelled) {
        return;
      }

      if (ratingResult.ok && ratingResult.rating) {
        setUserRating({
          id: ratingResult.rating.id,
          score: ratingResult.rating.score,
        });
      } else {
        setUserRating(null);
      }

      if (reviewResult.ok && reviewResult.review) {
        setUserReview({
          id: reviewResult.review.id,
          title: reviewResult.review.title,
          body: reviewResult.review.body,
          createdAt: reviewResult.review.createdAt,
          updatedAt: reviewResult.review.updatedAt,
        });
      } else {
        setUserReview(null);
      }

      setLoaded(true);
    }

    setLoaded(false);
    void loadUserContent();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, mediaType, status, tmdbId]);

  const ratingKey =
    loaded && userRating
      ? `${userRating.id}-${userRating.score}`
      : loaded
        ? "no-rating"
        : "loading-rating";

  return (
    <>
      <RatingControl
        key={ratingKey}
        tmdbId={tmdbId}
        mediaType={mediaType}
        isSignedIn={isSignedIn && status !== "loading"}
        signInCallbackUrl={signInCallbackUrl}
        initialRating={loaded ? userRating : null}
      />

      <div className="mt-4">
        <ReviewControl
          tmdbId={tmdbId}
          mediaType={mediaType}
          isSignedIn={isSignedIn && status !== "loading"}
          signInCallbackUrl={signInCallbackUrl}
          existingReview={loaded ? userReview : null}
        />
      </div>
    </>
  );
}
