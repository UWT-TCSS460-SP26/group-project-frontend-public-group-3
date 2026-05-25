import type { MediaType } from "@/lib/types";
import { ui } from "@/src/lib/ui";

type BrowseMediaType = Extract<MediaType, "movie" | "show">;

function buildTabHref(type: BrowseMediaType): string {
  const params = new URLSearchParams({
    type,
    page: "1",
  });
  return `/?${params.toString()}`;
}

export default function PopularBrowseTabs({
  activeType,
}: {
  activeType: BrowseMediaType;
}) {
  const isMovie = activeType === "movie";

  return (
    <nav
      className="mb-8 flex flex-wrap gap-3"
      aria-label="Popular browse categories"
    >
      <a
        href={buildTabHref("movie")}
        className={isMovie ? ui.tabActive : ui.tabInactive}
        aria-current={isMovie ? "page" : undefined}
      >
        Popular Movies
      </a>
      <a
        href={buildTabHref("show")}
        className={!isMovie ? ui.tabActive : ui.tabInactive}
        aria-current={!isMovie ? "page" : undefined}
      >
        Popular TV Shows
      </a>
    </nav>
  );
}
