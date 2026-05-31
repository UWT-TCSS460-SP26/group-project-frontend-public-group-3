/** Normalize TMDB poster paths so `<img src>` always receives a full URL. */
export function normalizePosterUrl(url: string | null | undefined): string | null {
  if (url == null) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `https://image.tmdb.org/t/p/w500${trimmed}`;
  }
  return trimmed;
}
