import type { ApiErrorResponse, MediaListResponse } from "./types";

const DEFAULT_API_BASE_URL = "https://group-2-9289.onrender.com";

function getApiBaseUrl(): string {
  const baseUrl = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return baseUrl.replace(/\/$/, "");
}

export async function searchMovies(
  title: string,
  page = 1,
): Promise<MediaListResponse> {
  const params = new URLSearchParams({
    title: title.trim(),
    page: String(page),
  });

  const url = `${getApiBaseUrl()}/v1/movies/search?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    let message = `Search request failed (${res.status})`;
    try {
      const body = (await res.json()) as ApiErrorResponse;
      if (body.error) {
        message = body.error;
      }
    } catch {
      // use default message
    }
    throw new Error(message);
  }

  return res.json() as Promise<MediaListResponse>;
}
