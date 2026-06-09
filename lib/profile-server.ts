import { ApiRequestError, getMovieDetail, getShowDetail } from "@/lib/api";
import { normalizePosterUrl } from "@/lib/poster-url";
import { fetchAllMyRatings } from "@/lib/ratings-server";
import {
  enrichMyReviewsWithTmdbIds,
  fetchAllMyReviews,
  listPublicReviewsForTitle,
  type MyReviewResponse,
} from "@/lib/reviews-server";
import { isValidTmdbId } from "@/lib/tmdb-id";
import type { EnrichedRatingResponse, MediaType } from "@/lib/types";

export type ReviewMediaMeta = {
  title: string;
  posterUrl: string | null;
  genres: string[];
};

export type ProfileContent = {
  ratings: EnrichedRatingResponse[];
  reviews: MyReviewResponse[];
  reviewMetaLookup: Record<string, ReviewMediaMeta>;
};

type TmdbMeta = NonNullable<EnrichedRatingResponse["tmdb"]>;

function mediaKey(mediaType: MediaType, tmdbId: number): string {
  return `${mediaType}:${tmdbId}`;
}

function metaFromTmdb(
  tmdbId: number,
  tmdb: EnrichedRatingResponse["tmdb"] | MyReviewResponse["tmdb"],
): ReviewMediaMeta {
  return {
    title: tmdb?.title ?? `Title #${tmdbId}`,
    posterUrl: normalizePosterUrl(tmdb?.posterUrl),
    genres: [],
  };
}

/** Public movie/show detail — reliable poster source when list endpoints omit art. */
async function fetchTitleMeta(
  mediaType: MediaType,
  tmdbId: number,
): Promise<ReviewMediaMeta> {
  try {
    const detail =
      mediaType === "movie"
        ? await getMovieDetail(tmdbId)
        : await getShowDetail(tmdbId);
    return {
      title: detail.title,
      posterUrl: normalizePosterUrl(detail.posterUrl),
      genres: detail.genres,
    };
  } catch {
    return { title: `Title #${tmdbId}`, posterUrl: null, genres: [] };
  }
}

const titleMetaCache = new Map<string, ReviewMediaMeta>();

async function getCachedTitleMeta(
  mediaType: MediaType,
  tmdbId: number,
  ratingTmdb: EnrichedRatingResponse["tmdb"] | null,
): Promise<ReviewMediaMeta> {
  const key = mediaKey(mediaType, tmdbId);
  const cached = titleMetaCache.get(key);
  if (cached?.posterUrl && cached.genres.length > 0) {
    return cached;
  }

  let meta = cached ?? metaFromTmdb(tmdbId, ratingTmdb);
  if (!meta.posterUrl || meta.genres.length === 0) {
    const detailMeta = await fetchTitleMeta(mediaType, tmdbId);
    meta = {
      title: meta.title.startsWith("Title #") ? detailMeta.title : meta.title,
      posterUrl: meta.posterUrl ?? detailMeta.posterUrl,
      genres: detailMeta.genres.length > 0 ? detailMeta.genres : meta.genres,
    };
  }

  titleMetaCache.set(key, meta);
  return meta;
}

/** Ensure rating rows include a poster (fetch detail API when `/v1/me/ratings` has null tmdb). */
async function enrichRatingsPosters(
  ratings: EnrichedRatingResponse[],
): Promise<EnrichedRatingResponse[]> {
  return Promise.all(
    ratings.map(async (rating) => {
      if (!isValidTmdbId(rating.tmdbId)) {
        return rating;
      }

      const existingPoster = normalizePosterUrl(rating.tmdb?.posterUrl);
      if (existingPoster) {
        return {
          ...rating,
          tmdb: rating.tmdb
            ? { ...rating.tmdb, posterUrl: existingPoster }
            : rating.tmdb,
        };
      }

      const meta = await getCachedTitleMeta(
        rating.mediaType,
        rating.tmdbId,
        rating.tmdb,
      );
      if (!meta.posterUrl && !rating.tmdb?.title) {
        return rating;
      }

      return {
        ...rating,
        tmdb: {
          title: rating.tmdb?.title ?? meta.title,
          year: rating.tmdb?.year ?? null,
          posterUrl: meta.posterUrl,
          overview: rating.tmdb?.overview ?? "",
        },
      };
    }),
  );
}

/** Match review ids to titles via public review lists (when `/v1/me/reviews` omits tmdbId). */
async function linkReviewsToTitles(
  reviews: MyReviewResponse[],
  ratings: EnrichedRatingResponse[],
): Promise<MyReviewResponse[]> {
  const linked = reviews.map((review) => ({ ...review }));

  for (const rating of ratings) {
    if (!isValidTmdbId(rating.tmdbId)) continue;

    let titleReviews;
    try {
      titleReviews = await listPublicReviewsForTitle(
        rating.tmdbId,
        rating.mediaType,
      );
    } catch {
      continue;
    }

    for (const row of titleReviews) {
      const index = linked.findIndex((review) => review.id === row.id);
      if (index < 0 || isValidTmdbId(linked[index].tmdbId)) continue;
      linked[index] = {
        ...linked[index],
        tmdbId: rating.tmdbId,
        mediaType: row.mediaType,
      };
    }
  }

  return linked;
}

/** Attach TMDB title + poster on each review for profile UI. */
async function attachPostersToReviews(
  reviews: MyReviewResponse[],
  ratings: EnrichedRatingResponse[],
): Promise<MyReviewResponse[]> {
  return Promise.all(
    reviews.map(async (review) => {
      if (!isValidTmdbId(review.tmdbId)) {
        return review;
      }

      const rating = ratings.find(
        (row) =>
          row.tmdbId === review.tmdbId && row.mediaType === review.mediaType,
      );
      const titleMeta = await getCachedTitleMeta(
        review.mediaType,
        review.tmdbId,
        rating?.tmdb ?? review.tmdb ?? null,
      );

      const tmdb: TmdbMeta = {
        title: review.tmdb?.title ?? titleMeta.title,
        year: review.tmdb?.year ?? rating?.tmdb?.year ?? null,
        posterUrl:
          normalizePosterUrl(review.tmdb?.posterUrl) ??
          normalizePosterUrl(rating?.tmdb?.posterUrl) ??
          titleMeta.posterUrl,
        overview: review.tmdb?.overview ?? rating?.tmdb?.overview ?? "",
      };

      return { ...review, tmdbId: review.tmdbId, tmdb };
    }),
  );
}

/** Lookup map for recent-activity and review rows (keyed by mediaType:tmdbId). */
async function buildReviewMetaLookup(
  reviews: MyReviewResponse[],
  ratings: EnrichedRatingResponse[],
): Promise<Record<string, ReviewMediaMeta>> {
  const lookup: Record<string, ReviewMediaMeta> = {};

  for (const rating of ratings) {
    if (!isValidTmdbId(rating.tmdbId)) continue;
    lookup[mediaKey(rating.mediaType, rating.tmdbId)] =
      await getCachedTitleMeta(rating.mediaType, rating.tmdbId, rating.tmdb);
  }

  for (const review of reviews) {
    if (!isValidTmdbId(review.tmdbId)) continue;
    const key = mediaKey(review.mediaType, review.tmdbId);
    const existing = lookup[key];
    const meta = await getCachedTitleMeta(
      review.mediaType,
      review.tmdbId,
      review.tmdb ?? null,
    );
    lookup[key] = {
      title: review.tmdb?.title ?? existing?.title ?? meta.title,
      posterUrl:
        normalizePosterUrl(review.tmdb?.posterUrl) ??
        existing?.posterUrl ??
        meta.posterUrl,
      genres: meta.genres.length > 0 ? meta.genres : (existing?.genres ?? []),
    };
  }

  return lookup;
}

/** Loads profile hub data on the server (avoids browser CORS to the partner API). */
export async function loadProfileContent(): Promise<ProfileContent> {
  titleMetaCache.clear();

  const [ratingsRaw, reviewsRaw] = await Promise.all([
    fetchAllMyRatings(),
    fetchAllMyReviews(),
  ]);

  const ratings = await enrichRatingsPosters(ratingsRaw);

  let reviews = reviewsRaw;
  try {
    reviews = await enrichMyReviewsWithTmdbIds(reviewsRaw, ratings);
  } catch {
    reviews = reviewsRaw;
  }

  reviews = await linkReviewsToTitles(reviews, ratings);
  reviews = await attachPostersToReviews(reviews, ratings);

  const reviewMetaLookup = await buildReviewMetaLookup(reviews, ratings);
  return { ratings, reviews, reviewMetaLookup };
}

export function profileLoadErrorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) {
    return err.message;
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return "Could not load your ratings and reviews.";
}
