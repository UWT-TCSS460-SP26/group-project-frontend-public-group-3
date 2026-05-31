/** Partner API requires tmdbId query params to be positive integers. */
export function isValidTmdbId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
