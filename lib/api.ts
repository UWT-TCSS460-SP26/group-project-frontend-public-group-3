import type {
  ApiErrorResponse,
  MediaListResponse,
  MovieDetailResponse,
  ShowDetailResponse,
} from "./types";

const DEFAULT_API_BASE_URL = "https://group-2-9289.onrender.com";

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

function getApiBaseUrl(): string {
  const baseUrl = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return baseUrl.replace(/\/$/, "");
}

async function parseApiError(res: Response): Promise<string> {
  let message = `Request failed (${res.status})`;
  try {
    const body = (await res.json()) as ApiErrorResponse;
    if (body.error) {
      message = body.error;
    }
  } catch {
    // use default message
  }
  return message;
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
    throw new ApiRequestError(await parseApiError(res), res.status);
  }

  return res.json() as Promise<MediaListResponse>;
}

export async function searchTvShows(
  title: string,
  page = 1,
): Promise<MediaListResponse> {
  const params = new URLSearchParams({
    title: title.trim(),
    page: String(page),
  });

  const url = `${getApiBaseUrl()}/v1/tv-shows/search?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new ApiRequestError(await parseApiError(res), res.status);
  }

  return res.json() as Promise<MediaListResponse>;
}

export async function getPopularMovies(
  page = 1,
): Promise<MediaListResponse> {
  const params = new URLSearchParams({
    page: String(page),
  });

  const url = `${getApiBaseUrl()}/v1/movies/popular?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new ApiRequestError(await parseApiError(res), res.status);
  }

  return res.json() as Promise<MediaListResponse>;
}

export async function getPopularTvShows(
  page = 1,
): Promise<MediaListResponse> {
  const params = new URLSearchParams({
    page: String(page),
  });

  const url = `${getApiBaseUrl()}/v1/tv-shows/popular?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new ApiRequestError(await parseApiError(res), res.status);
  }

  return res.json() as Promise<MediaListResponse>;
}

export async function getMovieDetail(id: number): Promise<MovieDetailResponse> {
  const url = `${getApiBaseUrl()}/v1/movies/${id}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new ApiRequestError(await parseApiError(res), res.status);
  }

  return res.json() as Promise<MovieDetailResponse>;
}

export async function getShowDetail(id: number): Promise<ShowDetailResponse> {
  const url = `${getApiBaseUrl()}/v1/tv-shows/${id}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new ApiRequestError(await parseApiError(res), res.status);
  }

  return res.json() as Promise<ShowDetailResponse>;
}
