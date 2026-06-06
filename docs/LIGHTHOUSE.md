# Lighthouse performance fixes

Audited routes: `/details?type=movie&id=…`, `/?type=movie&page=1` (Chrome Lighthouse, mobile).

## 1. LCP request discovery

Lighthouse flagged the details hero poster because it loaded without priority hints. We replaced the plain `<img>` with a shared `PosterImage` component using `next/image`, `priority`, and `fetchPriority="high"`, plus a right-sized TMDB `w342` URL so the browser discovers and fetches the LCP image immediately.

## 2. Improve image delivery

Lighthouse reported ~168 KiB savings from serving TMDB `w500` posters in small slots (list cards ~96px wide). We added `tmdbPosterUrl()` in `lib/poster-url.ts` and use `w185` for cards/thumbs and `w342` for the details hero and recommendation grid via `PosterImage`.

## 3. Back/forward cache (bfcache)

Lighthouse reported `/details` was blocked from bfcache because of `Cache-Control: no-store` on the document and fetches. We cache public detail API responses (`revalidate: 300`), moved Header auth UI to the client (`useSession`), and deferred user rating/review loading to `DetailsUserControls` so the public HTML shell is less dynamic. Signed-in sessions may still fail bfcache when NextAuth refreshes the session.

## Verification

- Re-run Lighthouse on `/details?type=movie&id=…` in incognito
- Re-run on `/?type=movie&page=1` for list-card image delivery
- Confirm sign-in, rating, and review still work on the details page
