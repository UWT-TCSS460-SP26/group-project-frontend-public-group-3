"use server";

import { revalidatePath } from "next/cache";
import { ApiRequestError } from "@/lib/api";
import { deleteRating, submitRating } from "@/lib/ratings-server";
import type { MediaType, RatingResponse } from "@/lib/types";

export type SubmitRatingResult =
  | { ok: true; rating: RatingResponse }
  | { ok: false; error: string };
export type DeleteRatingResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitRatingAction(
  tmdbId: number,
  mediaType: MediaType,
  score: number,
  existingRatingId: number | null,
): Promise<SubmitRatingResult> {
  try {
    const rating = await submitRating(
      tmdbId,
      mediaType,
      score,
      existingRatingId,
    );
    revalidatePath("/details");
    revalidatePath("/profile");
    return { ok: true, rating };
  } catch (err) {
    const message =
      err instanceof ApiRequestError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Could not save your rating.";
    return { ok: false, error: message };
  }
}

export async function deleteRatingAction(
  ratingId: number,
): Promise<DeleteRatingResult> {
  try {
    await deleteRating(ratingId);
    revalidatePath("/details");
    revalidatePath("/profile");
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof ApiRequestError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Could not delete your rating.";
    return { ok: false, error: message };
  }
}
