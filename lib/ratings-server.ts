import { auth } from "@/src/lib/auth";
import { ApiRequestError } from "@/lib/api";
import type {
  EnrichedRatingListResponse,
  EnrichedRatingResponse,
  MediaType,
  RatingResponse,
} from "@/lib/types";

const DEFAULT_API_BASE_URL = "https://group-2-9289.onrender.com";

function getApiBaseUrl(): string {
  const baseUrl = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return baseUrl.replace(/\/$/, "");
}

async function getAccessToken(): Promise<string> {
  const session = await auth();
  if (!session?.accessToken) {
    throw new ApiRequestError("Not signed in", 401);
  }
  return session.accessToken;
}

async function partnerAuthedFetch<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) {
        message = data.error;
      }
    } catch {
      // use default message
    }
    throw new ApiRequestError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

async function listRatingsForTitle(
  tmdbId: number,
  mediaType: MediaType,
): Promise<RatingResponse[]> {
  const pageSize = 50;
  let page = 1;
  let totalPages = 1;
  const all: RatingResponse[] = [];

  while (page <= totalPages) {
    const data = await partnerAuthedFetch<{
      page: number;
      pageSize: number;
      totalPages: number;
      totalResults: number;
      results: RatingResponse[];
    }>(
      "GET",
      `/v1/ratings?tmdbId=${tmdbId}&mediaType=${mediaType}&page=${page}&pageSize=${pageSize}`,
    );
    all.push(...data.results);
    totalPages = data.totalPages;
    page += 1;
  }

  return all;
}

export async function getMyRatingForTitle(
  tmdbId: number,
  mediaType: MediaType,
): Promise<EnrichedRatingResponse | null> {
  const myRatingIds = new Set<number>();
  const pageSize = 50;
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const data = await partnerAuthedFetch<EnrichedRatingListResponse>(
      "GET",
      `/v1/me/ratings?page=${page}&pageSize=${pageSize}`,
    );

    const found =
      data.results.find(
        (rating) => rating.tmdbId === tmdbId && rating.mediaType === mediaType,
      ) ?? null;
    if (found) {
      return found;
    }

    for (const rating of data.results) {
      myRatingIds.add(rating.id);
    }

    totalPages = data.totalPages;
    page += 1;
  }

  if (myRatingIds.size === 0) {
    return null;
  }

  const titleRatings = await listRatingsForTitle(tmdbId, mediaType);
  const found =
    titleRatings.find((rating) => myRatingIds.has(rating.id)) ?? null;
  if (found) {
    return { ...found, tmdbId, tmdb: null };
  }

  return null;
}

export async function createRating(
  tmdbId: number,
  mediaType: MediaType,
  score: number,
): Promise<RatingResponse> {
  return partnerAuthedFetch<RatingResponse>("POST", "/v1/ratings", {
    tmdbId,
    mediaType,
    score,
  });
}

export async function updateRating(
  ratingId: number,
  score: number,
): Promise<RatingResponse> {
  return partnerAuthedFetch<RatingResponse>("PUT", `/v1/ratings/${ratingId}`, {
    score,
  });
}

export async function deleteRating(ratingId: number): Promise<void> {
  await partnerAuthedFetch<void>("DELETE", `/v1/ratings/${ratingId}`);
}

export async function submitRating(
  tmdbId: number,
  mediaType: MediaType,
  score: number,
  existingRatingId: number | null,
): Promise<RatingResponse> {
  if (!Number.isInteger(score) || score < 1 || score > 10) {
    throw new ApiRequestError(
      "score must be an integer between 1 and 10",
      400,
    );
  }

  let resolvedRatingId = existingRatingId;

  if (resolvedRatingId == null) {
    const existing = await getMyRatingForTitle(tmdbId, mediaType);
    resolvedRatingId = existing?.id ?? null;
  }

  if (resolvedRatingId != null) {
    return updateRating(resolvedRatingId, score);
  }

  try {
    return await createRating(tmdbId, mediaType, score);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 409) {
      // If create races with a prior write, resolve the created row and retry update.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const existing = await getMyRatingForTitle(tmdbId, mediaType);
        if (existing) {
          return updateRating(existing.id, score);
        }
        await new Promise((resolve) => setTimeout(resolve, 120));
      }

      // Fallback for partner responses where /v1/me/ratings doesn't include this row.
      const titleRatings = await listRatingsForTitle(tmdbId, mediaType);
      for (const rating of titleRatings) {
        try {
          return await updateRating(rating.id, score);
        } catch (updateErr) {
          if (
            updateErr instanceof ApiRequestError &&
            (updateErr.status === 403 || updateErr.status === 404)
          ) {
            continue;
          }
          throw updateErr;
        }
      }
    }
    throw err;
  }
}
