import { auth } from "@/src/lib/auth";
import { ApiRequestError } from "@/lib/api";
import type { MediaType, ReviewListResponse, ReviewResponse } from "@/lib/types";

const DEFAULT_API_BASE_URL = "https://group-2-9289.onrender.com";

type MyReviewResponse = ReviewResponse & {
  tmdbId?: number;
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
