export type TmdbPosterSize = "w185" | "w342" | "w500";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

/** Build a TMDB poster URL at the requested width (smaller sizes improve Lighthouse image delivery). */
export function tmdbPosterUrl(
  url: string | null | undefined,
  size: TmdbPosterSize = "w500",
): string | null {
  if (url == null) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return `${TMDB_IMAGE_BASE}/${size}${trimmed}`;
  }

  const tmdbMatch = trimmed.match(
    /^https:\/\/image\.tmdb\.org\/t\/p\/w\d+\/(.+)$/,
  );
  if (tmdbMatch) {
    return `${TMDB_IMAGE_BASE}/${size}/${tmdbMatch[1]}`;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return trimmed;
}

/** Normalize TMDB poster paths so `<img src>` always receives a full URL. */
export function normalizePosterUrl(url: string | null | undefined): string | null {
  return tmdbPosterUrl(url, "w500");
}
