export type MediaType = "movie" | "show";

export type MediaListItem = {
  id: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
  overview: string;
  mediaType: MediaType;
};

export type MediaListResponse = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: MediaListItem[];
};

export type ApiErrorResponse = {
  error: string;
};
