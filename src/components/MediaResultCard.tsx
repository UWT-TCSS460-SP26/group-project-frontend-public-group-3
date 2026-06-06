import { Montserrat } from "next/font/google";

import type { MediaListItem, MediaType } from "@/lib/types";
import PosterImage from "@/src/components/PosterImage";
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
          <PosterImage
            src={item.posterUrl}
            alt={`${item.title} poster`}
            width={96}
            height={144}
            size="w185"
            sizes="96px"
          />
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
