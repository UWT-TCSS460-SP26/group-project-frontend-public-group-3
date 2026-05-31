import { auth } from "@/src/lib/auth";
import { ApiRequestError } from "@/lib/api";
import { isValidTmdbId } from "@/lib/tmdb-id";
import type {
  EnrichedRatingResponse,
  MediaType,
  ReviewListResponse,
  ReviewResponse,
} from "@/lib/types";

const DEFAULT_API_BASE_URL = "https://group-2-9289.onrender.com";

export type MyReviewResponse = ReviewResponse & {
  tmdbId?: number;
  tmdb?: {
    title: string;
    year: number | null;
    posterUrl: string | null;
    overview: string;
  } | null;
};

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
      // use default
    }
    throw new ApiRequestError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

/** All reviews for the signed-in user (paginated server-side). */
export async function fetchAllMyReviews(): Promise<MyReviewResponse[]> {
  const pageSize = 50;
  let page = 1;
  let totalPages = 1;
  const all: MyReviewResponse[] = [];

  while (page <= totalPages) {
    const data = await partnerAuthedFetch<ReviewListResponse>(
      "GET",
      `/v1/me/reviews?page=${page}&pageSize=${pageSize}&sort=createdAt:desc`,
    );
    all.push(...(data.results as MyReviewResponse[]));
    totalPages = data.totalPages;
    page += 1;
  }

  return all;
}

export async function listPublicReviewsForTitle(
  tmdbId: number,
  mediaType: MediaType,
): Promise<ReviewResponse[]> {
  if (!isValidTmdbId(tmdbId)) {
    return [];
  }

  const pageSize = 50;
  let page = 1;
  let totalPages = 1;
  const all: ReviewResponse[] = [];

  while (page <= totalPages) {
    const data = await partnerAuthedFetch<ReviewListResponse>(
      "GET",
      `/v1/reviews?tmdbId=${tmdbId}&mediaType=${mediaType}&page=${page}&pageSize=${pageSize}`,
    );
    all.push(...data.results);
    totalPages = data.totalPages;
    page += 1;
  }

  return all;
}

async function listPublicReviewsForUser(userId: number): Promise<ReviewResponse[]> {
  const pageSize = 50;
  let page = 1;
  let totalPages = 1;
  const all: ReviewResponse[] = [];

  while (page <= totalPages) {
    const data = await partnerAuthedFetch<ReviewListResponse>(
      "GET",
      `/v1/reviews?userId=${userId}&page=${page}&pageSize=${pageSize}`,
    );
    all.push(...data.results);
    totalPages = data.totalPages;
    page += 1;
  }

  return all;
}

/**
 * `/v1/me/reviews` often omits `tmdbId`. Resolve it by matching review ids against
 * public title lists (same strategy as `getMyReviewForTitle`).
 */
function reviewNeedsTmdbId(review: MyReviewResponse): boolean {
  return !isValidTmdbId(review.tmdbId);
}

export async function enrichMyReviewsWithTmdbIds(
  reviews: MyReviewResponse[],
  ratings?: EnrichedRatingResponse[],
): Promise<MyReviewResponse[]> {
  const unresolvedIds = new Set(
    reviews.filter((review) => reviewNeedsTmdbId(review)).map((review) => review.id),
  );
  if (unresolvedIds.size === 0) {
    return reviews;
  }

  const resolved = new Map<number, { tmdbId: number; mediaType: MediaType }>();
  const ratingRows = (ratings ?? []).filter((rating) =>
    isValidTmdbId(rating.tmdbId),
  );
  const seenTitleKeys = new Set<string>();

  for (const rating of ratingRows) {
    const titleKey = `${rating.mediaType}:${rating.tmdbId}`;
    if (seenTitleKeys.has(titleKey)) continue;
    seenTitleKeys.add(titleKey);

    let titleReviews: ReviewResponse[] = [];
    try {
      titleReviews = await listPublicReviewsForTitle(
        rating.tmdbId,
        rating.mediaType,
      );
    } catch {
      // Skip this title if the partner API rejects the lookup.
      continue;
    }
    for (const row of titleReviews) {
      if (unresolvedIds.has(row.id) && !resolved.has(row.id)) {
        resolved.set(row.id, {
          tmdbId: rating.tmdbId,
          mediaType: rating.mediaType,
        });
      }
    }
  }

  const stillUnresolved = reviews.filter(
    (review) => reviewNeedsTmdbId(review) && !resolved.has(review.id),
  );
  if (stillUnresolved.length > 0 && isValidTmdbId(stillUnresolved[0].author.id)) {
    try {
      const userReviews = await listPublicReviewsForUser(
        stillUnresolved[0].author.id,
      );
      for (const row of userReviews) {
        const extended = row as MyReviewResponse;
        if (
          unresolvedIds.has(row.id) &&
          !resolved.has(row.id) &&
          isValidTmdbId(extended.tmdbId)
        ) {
          resolved.set(row.id, {
            tmdbId: extended.tmdbId,
            mediaType: row.mediaType,
          });
        }
      }
    } catch {
      // optional fallback — profile still renders without links
    }
  }

  for (const review of reviews) {
    if (!reviewNeedsTmdbId(review) || resolved.has(review.id)) continue;
    try {
      const detail = await partnerAuthedFetch<MyReviewResponse>(
        "GET",
        `/v1/reviews/${review.id}`,
      );
      if (isValidTmdbId(detail.tmdbId)) {
        resolved.set(review.id, {
          tmdbId: detail.tmdbId,
          mediaType: detail.mediaType,
        });
      }
    } catch {
      // keep unresolved — UI still allows edit/delete
    }
  }

  return reviews.map((review) => {
    const match = resolved.get(review.id);
    if (reviewNeedsTmdbId(review) && match) {
      return { ...review, tmdbId: match.tmdbId, mediaType: match.mediaType };
    }
    if (reviewNeedsTmdbId(review)) {
      return { ...review, tmdbId: undefined };
    }
    return review;
  });
}

export async function getMyReviewForTitle(
  tmdbId: number,
  mediaType: MediaType,
): Promise<ReviewResponse | null> {
  const myReviewIds = new Set<number>();
  const pageSize = 50;
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const data = await partnerAuthedFetch<ReviewListResponse>(
      "GET",
      `/v1/me/reviews?page=${page}&pageSize=${pageSize}`,
    );
    const found =
      (data.results as MyReviewResponse[]).find(
        (review) => review.mediaType === mediaType && review.tmdbId === tmdbId,
      ) ?? null;
    if (found) {
      return found;
    }

    for (const review of data.results) {
      myReviewIds.add(review.id);
    }

    totalPages = data.totalPages;
    page += 1;
  }

  if (myReviewIds.size === 0) {
    return null;
  }

  page = 1;
  totalPages = 1;
  while (page <= totalPages) {
    const data = await partnerAuthedFetch<ReviewListResponse>(
      "GET",
      `/v1/reviews?tmdbId=${tmdbId}&mediaType=${mediaType}&page=${page}&pageSize=${pageSize}`,
    );

    const found = data.results.find((review) => myReviewIds.has(review.id)) ?? null;
    if (found) {
      return found;
    }

    totalPages = data.totalPages;
    page += 1;
  }

  return null;
}

export async function createReview(
  tmdbId: number,
  mediaType: MediaType,
  title: string | null,
  body: string,
): Promise<ReviewResponse> {
  return partnerAuthedFetch<ReviewResponse>("POST", "/v1/reviews", {
    tmdbId,
    mediaType,
    title: title?.trim() || null,
    body,
  });
}

export async function updateReview(
  reviewId: number,
  title: string | null,
  body: string,
): Promise<ReviewResponse> {
  return partnerAuthedFetch<ReviewResponse>("PUT", `/v1/reviews/${reviewId}`, {
    title: title?.trim() || null,
    body,
  });
}

export async function deleteReview(reviewId: number): Promise<void> {
  await partnerAuthedFetch<void>("DELETE", `/v1/reviews/${reviewId}`);
}
