"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError } from "@/lib/api";
import {
  createReview,
  deleteReview,
  updateReview,
} from "@/lib/reviews-server";
import type { MediaType, ReviewResponse } from "@/lib/types";

export type UpsertReviewResult =
  | { ok: true; review: ReviewResponse }
  | { ok: false; error: string };

export type DeleteReviewResult =
  | { ok: true }
  | { ok: false; error: string };

export async function upsertReviewAction(
  tmdbId: number,
  mediaType: MediaType,
  existingReviewId: number | null,
  title: string,
  body: string,
): Promise<UpsertReviewResult> {
  try {
    const review =
      existingReviewId == null
        ? await createReview(tmdbId, mediaType, title, body)
        : await updateReview(existingReviewId, title, body);
    revalidatePath("/details");
    revalidatePath("/profile");
    return { ok: true, review };
  } catch (err) {
    const message =
      err instanceof ApiRequestError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Could not save your review.";
    return { ok: false, error: message };
  }
}

/** Updates an existing review (does not need tmdbId). */
export async function saveReviewAction(
  reviewId: number,
  title: string,
  body: string,
): Promise<UpsertReviewResult> {
  try {
    const review = await updateReview(reviewId, title, body);
    revalidatePath("/details");
    revalidatePath("/profile");
    return { ok: true, review };
  } catch (err) {
    const message =
      err instanceof ApiRequestError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Could not save your review.";
    return { ok: false, error: message };
  }
}

export async function deleteReviewAction(
  reviewId: number,
): Promise<DeleteReviewResult> {
  try {
    await deleteReview(reviewId);
    revalidatePath("/details");
    revalidatePath("/profile");
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof ApiRequestError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Could not delete your review.";
    return { ok: false, error: message };
  }
}
