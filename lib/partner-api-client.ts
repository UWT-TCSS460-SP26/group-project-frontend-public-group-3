import type {
  EnrichedRatingListResponse,
  EnrichedRatingResponse,
  ReviewListResponse,
} from "@/lib/types";

const DEFAULT_API_BASE_URL = "https://group-2-9289.onrender.com";

export function getPartnerApiBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_PARTNER_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return base.replace(/\/$/, "");
}

export class PartnerApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "PartnerApiError";
  }
}

/** Authenticated partner API request — caller supplies the session access token. */
export async function partnerAuthedRequest<T>(
  accessToken: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${getPartnerApiBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
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
    throw new PartnerApiError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

/** Paginate through every page of the signed-in user's enriched ratings. */
export async function fetchAllMyRatings(
  accessToken: string,
  signal?: AbortSignal,
): Promise<EnrichedRatingResponse[]> {
  const pageSize = 50;
  let page = 1;
  let totalPages = 1;
  const all: EnrichedRatingResponse[] = [];

  while (page <= totalPages) {
    const data = await partnerAuthedRequest<EnrichedRatingListResponse>(
      accessToken,
      "GET",
      `/v1/me/ratings?page=${page}&pageSize=${pageSize}`,
      undefined,
      signal,
    );
    all.push(...data.results);
    totalPages = data.totalPages;
    page += 1;
  }

  return all;
}

/** Review rows from `/v1/me/reviews` may include `tmdbId` even though the base type omits it. */
export type MyReviewResponse = ReviewListResponse["results"][number] & {
  tmdbId?: number;
  tmdb?: {
    title: string;
    year: number | null;
    posterUrl: string | null;
    overview: string;
  } | null;
};

/** Paginate through every page of the signed-in user's reviews. */
export async function fetchAllMyReviews(
  accessToken: string,
  signal?: AbortSignal,
): Promise<MyReviewResponse[]> {
  const pageSize = 50;
  let page = 1;
  let totalPages = 1;
  const all: MyReviewResponse[] = [];

  while (page <= totalPages) {
    const data = await partnerAuthedRequest<ReviewListResponse>(
      accessToken,
      "GET",
      `/v1/me/reviews?page=${page}&pageSize=${pageSize}&sort=createdAt:desc`,
      undefined,
      signal,
    );
    all.push(...(data.results as MyReviewResponse[]));
    totalPages = data.totalPages;
    page += 1;
  }

  return all;
}
