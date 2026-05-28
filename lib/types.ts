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

export type UserContentAuthor = {
  id: number;
  username: string;
};

export type ReviewResponse = {
  id: number;
  mediaType: MediaType;
  title: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: UserContentAuthor;
};

export type ReviewListResponse = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalResults: number;
  results: ReviewResponse[];
};

export type CommunitySummary = {
  averageScore: number | null;
  ratingCount: number;
  reviewCount: number;
  recentReviews: ReviewResponse[];
};

export type MovieDetailResponse = {
  id: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  overview: string;
  genres: string[];
  runtimeMinutes: number | null;
  status: string;
  rating: number;
  community: CommunitySummary;
};

export type ShowDetailResponse = {
  id: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  overview: string;
  genres: string[];
  seasonCount: number;
  episodeCount: number;
  status: string;
  rating: number;
  community: CommunitySummary;
};

export type MediaDetailResponse = MovieDetailResponse | ShowDetailResponse;

export function isMovieDetail(
  detail: MediaDetailResponse,
): detail is MovieDetailResponse {
  return "runtimeMinutes" in detail;
}

export type RatingResponse = {
  id: number;
  mediaType: MediaType;
  score: number;
  createdAt: string;
  updatedAt: string;
  author: UserContentAuthor;
};

export type EnrichedRatingResponse = RatingResponse & {
  tmdbId: number;
  tmdb: {
    title: string;
    year: number | null;
    posterUrl: string | null;
    overview: string;
  } | null;
};

export type EnrichedRatingListResponse = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalResults: number;
  results: EnrichedRatingResponse[];
};
