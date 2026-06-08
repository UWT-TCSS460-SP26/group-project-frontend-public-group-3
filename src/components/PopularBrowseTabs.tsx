import type { MediaType } from "@/lib/types";
import { ui } from "@/src/lib/ui";

type BrowseMediaType = Extract<MediaType, "movie" | "show">;

function buildTabHref(
  type: BrowseMediaType,
  activeType: BrowseMediaType,
  sort?: string,
  genre?: string,
): string {
  const params = new URLSearchParams({
    type,
    page: "1",
  });
  if (sort && sort !== "popular") {
    params.set("sort", sort);
  }
  if (type === activeType && genre && genre !== "all") {
    params.set("genre", genre);
  }
  return `/?${params.toString()}`;
}

export default function PopularBrowseTabs({
  activeType,
  sort = "popular",
  genre = "all",
}: {
  activeType: BrowseMediaType;
  sort?: string;
  genre?: string;
}) {
  const isMovie = activeType === "movie";

  return (
    <nav
      className="mb-8 flex flex-wrap gap-3"
      aria-label="Popular browse categories"
    >
      <a
        href={buildTabHref("movie", activeType, sort, genre)}
        className={isMovie ? ui.tabActive : ui.tabInactive}
        aria-current={isMovie ? "page" : undefined}
      >
        Popular Movies
      </a>
      <a
        href={buildTabHref("show", activeType, sort, genre)}
        className={!isMovie ? ui.tabActive : ui.tabInactive}
        aria-current={!isMovie ? "page" : undefined}
      >
        Popular TV Shows
      </a>
    </nav>
  );
}
