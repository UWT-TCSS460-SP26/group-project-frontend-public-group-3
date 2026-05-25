"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { ui } from "@/src/lib/ui";

type SearchMediaType = "movie" | "show";

function parseMediaType(value: string | null): SearchMediaType {
  return value === "show" ? "show" : "movie";
}

export default function SearchBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onSearchPage = pathname === "/search";
  const mediaType = onSearchPage
    ? parseMediaType(searchParams.get("type"))
    : "movie";
  const title = onSearchPage ? (searchParams.get("title") ?? "") : "";
  const isMovie = mediaType === "movie";

  return (
    <form
      action="/search"
      method="get"
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
        <div className="flex flex-col gap-1.5 sm:w-40">
          <label htmlFor="header-search-type" className={ui.label}>
            Type
          </label>
          <select
            id="header-search-type"
            name="type"
            defaultValue={mediaType}
            className={ui.select}
          >
            <option value="movie">Movies</option>
            <option value="show">TV Shows</option>
          </select>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="header-search-title" className={ui.label}>
            Title
          </label>
          <input
            id="header-search-title"
            name="title"
            type="search"
            defaultValue={title}
            placeholder={isMovie ? "e.g. Fight Club" : "e.g. The Office"}
            required
            className={ui.input}
          />
        </div>
      </div>
      <button type="submit" className={ui.pillPrimary}>
        Search
      </button>
    </form>
  );
}
