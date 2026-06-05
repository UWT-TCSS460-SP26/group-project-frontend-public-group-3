import { Montserrat } from "next/font/google";

import type { MediaListItem, MediaType } from "@/lib/types";
import { ui, mediaBadgeClass } from "@/src/lib/ui";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export function buildDetailHref(type: MediaType, id: number): string {
  const params = new URLSearchParams({
    type,
    id: String(id),
  });
  return `/details?${params.toString()}`;
}

export default function MediaResultCard({ item }: { item: MediaListItem }) {
  const yearLabel = item.year != null ? String(item.year) : "—";

  return (
    <a href={buildDetailHref(item.mediaType, item.id)} className={ui.cardInteractive}>
      <article className="flex items-start gap-5">
        <div className={ui.poster}>
          {item.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- TMDB posters; avoids next.config remotePatterns
            <img
              src={item.posterUrl}
              alt={`${item.title} poster`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted">
              No poster
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2
              className={`text-lg font-semibold leading-snug text-brand ${montserrat.className}`}
            >
              {item.title}
            </h2>
            <span className={mediaBadgeClass(item.mediaType)}>{item.mediaType}</span>
          </div>
          <p className="mb-2 text-sm text-muted">{yearLabel}</p>
          <p className="line-clamp-3 text-sm leading-relaxed text-prose">
            {item.overview}
          </p>
        </div>
      </article>
    </a>
  );
}
