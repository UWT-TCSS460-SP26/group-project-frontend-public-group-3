import Image from "next/image";

import {
  tmdbPosterUrl,
  type TmdbPosterSize,
} from "@/lib/poster-url";

type PosterImageProps = {
  src: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  size?: TmdbPosterSize;
  priority?: boolean;
  className?: string;
  sizes?: string;
  placeholderClassName?: string;
};

export default function PosterImage({
  src,
  alt,
  width,
  height,
  size = "w500",
  priority = false,
  className = "h-full w-full object-cover",
  sizes,
  placeholderClassName = "flex h-full w-full items-center justify-center bg-mint-soft px-2 text-center text-xs text-muted",
}: PosterImageProps) {
  const url = tmdbPosterUrl(src, size);

  if (!url) {
    return (
      <div className={placeholderClassName} aria-hidden={alt ? undefined : true}>
        No poster
      </div>
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      fetchPriority={priority ? "high" : undefined}
      loading={priority ? undefined : "lazy"}
      sizes={sizes}
      className={className}
    />
  );
}
