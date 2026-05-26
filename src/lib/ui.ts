/** Prodmast-inspired shared UI class strings */
import type { MediaType } from "@/lib/types";

export const ui = {
  page: "min-h-screen bg-surface text-brand",
  container: "mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8",
  header:
    "border-b border-brand-hover bg-brand text-white shadow-sm",
  headerNavLink:
    "rounded-full px-4 py-2 text-sm font-medium text-mint transition-colors hover:bg-white/10 hover:text-white",
  headerSearchPanel:
    "mt-5 rounded-3xl bg-mint/90 p-4 ring-1 ring-white/20",
  eyebrow: "mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted",
  title: "text-3xl font-bold tracking-tight text-brand sm:text-4xl",
  subtitle: "mt-3 max-w-xl text-base leading-relaxed text-muted",
  card: "rounded-3xl border border-border bg-white p-6 shadow-sm",
  cardInteractive:
    "block w-full rounded-3xl border border-border bg-mint/90 p-5 shadow-sm transition-all hover:border-brand/20 hover:bg-mint hover:shadow-md focus:outline-none focus:ring-2 focus:ring-mint/60",
  pillPrimary:
    "rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2",
  pillSecondary:
    "rounded-full border border-border bg-white px-5 py-2.5 text-sm font-medium text-brand shadow-sm transition-colors hover:border-brand/30 hover:bg-mint-soft",
  pillMint:
    "rounded-full bg-mint px-5 py-2.5 text-sm font-semibold text-brand shadow-sm transition-colors hover:bg-mint/80",
  navLink:
    "rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-mint-soft hover:text-brand",
  badge: "rounded-full bg-mint px-3 py-1 text-xs font-semibold capitalize text-brand",
  badgeMovie:
    "rounded-full bg-badge-movie-bg px-3 py-1 text-xs font-semibold capitalize text-badge-movie-text",
  badgeShow:
    "rounded-full bg-badge-show-bg px-3 py-1 text-xs font-semibold capitalize text-badge-show-text",
  badgeMuted:
    "rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted ring-1 ring-border",
  input:
    "rounded-full border border-border bg-white px-4 py-2.5 text-sm text-brand outline-none transition-colors placeholder:text-muted/60 focus:border-brand focus:ring-2 focus:ring-mint/50",
  select:
    "rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium text-brand outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-mint/50",
  label: "text-xs font-semibold uppercase tracking-wide text-muted",
  emptyState:
    "rounded-3xl border border-dashed border-border bg-white px-6 py-14 text-center shadow-sm",
  paginationLink:
    "rounded-full border border-border bg-white px-5 py-2 text-sm font-medium text-brand shadow-sm transition-colors hover:border-brand/30 hover:bg-mint-soft",
  alert: "rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-red-800",
  statBox: "rounded-2xl bg-mint-soft px-4 py-3",
  loadingCard:
    "rounded-3xl border border-border bg-white px-6 py-16 text-center shadow-sm",
  loadingPanel:
    "flex flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-white px-6 py-16 shadow-sm",
  tabActive: "rounded-full bg-mint px-5 py-2.5 text-sm font-semibold text-brand shadow-sm",
  tabInactive:
    "rounded-full border border-border bg-white px-5 py-2.5 text-sm font-medium text-brand shadow-sm transition-colors hover:border-brand/30 hover:bg-mint-soft",
  poster: "h-36 w-24 shrink-0 overflow-hidden rounded-2xl bg-mint-soft",
  darkPanel: "rounded-3xl bg-brand p-6 text-white shadow-sm sm:p-8",
  pillOnDark:
    "rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/20",
} as const;

export function mediaBadgeClass(mediaType: MediaType): string {
  return mediaType === "show" ? ui.badgeShow : ui.badgeMovie;
}
