/** Prodmast-inspired shared UI class strings */
import type { MediaType } from "@/lib/types";

export const ui = {
  page: "min-h-dvh bg-surface text-brand",
  container: "mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8",
  header:
    "border-b border-brand-bg-hover bg-brand-bg text-white shadow-sm",
  themeToggle:
    "inline-flex h-10 min-h-10 w-10 min-w-10 shrink-0 grow-0 cursor-pointer touch-manipulation items-center justify-center rounded-full border-2 border-white/50 bg-white/20 text-xl leading-none text-white shadow-sm transition-colors hover:bg-white/30 active:bg-white/40",
  headerNavLink:
    "shrink-0 rounded-full px-3 py-2 text-sm font-medium text-header-mint transition-colors hover:bg-white/10 hover:text-white sm:px-4",
  headerSearchPanel:
    "mt-5 rounded-3xl bg-mint/90 p-4 ring-1 ring-white/20",
  eyebrow: "mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted",
  title: "text-3xl font-bold tracking-tight text-brand sm:text-4xl",
  subtitle: "mt-3 max-w-xl text-base leading-relaxed text-prose",
  card: "rounded-3xl border border-border bg-card p-6 shadow-sm",
  cardInteractive:
    "block w-full rounded-3xl border border-border bg-mint/90 p-5 shadow-sm transition-all hover:border-brand/20 hover:bg-mint hover:shadow-md focus:outline-none focus:ring-2 focus:ring-mint/60",
  pillPrimary:
    "rounded-full bg-brand-bg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-bg-hover focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 active:scale-95",
  pillSecondary:
    "rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-brand shadow-sm transition-colors hover:border-brand/30 hover:bg-mint-soft active:scale-95",
  pillMint:
    "rounded-full bg-mint px-5 py-2.5 text-sm font-semibold text-brand shadow-sm transition-colors hover:bg-mint/80 active:scale-95",
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
    "rounded-full border border-border bg-card px-4 py-2.5 text-sm text-brand outline-none transition-colors placeholder:text-muted/60 focus:border-brand focus:ring-2 focus:ring-mint/50",
  select:
    "rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-brand outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-mint/50",
  label: "text-xs font-semibold uppercase tracking-wide text-muted",
  emptyState:
    "rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-sm",
  paginationLink:
    "shrink-0 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-brand shadow-sm transition-colors hover:border-brand/30 hover:bg-mint-soft focus:outline-none focus:ring-2 focus:ring-mint/50 sm:px-5",
  paginationNavTop:
    "mb-8 flex flex-col gap-3 border-b border-border pb-8 sm:flex-row sm:items-center sm:justify-between",
  paginationNavBottom:
    "mt-10 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between",
  paginationControls:
    "flex w-full items-center gap-2 sm:w-auto sm:justify-center sm:gap-2",
  paginationPrev: "shrink-0",
  paginationNext: "shrink-0",
  paginationPages:
    "flex min-w-0 flex-1 flex-nowrap items-center justify-center gap-0.5 px-1 sm:gap-1 sm:px-0",
  paginationPageLink:
    "inline-flex min-w-8 items-center justify-center rounded-full border border-border bg-card px-2 py-2 text-sm font-medium text-brand shadow-sm transition-colors hover:border-brand/30 hover:bg-mint-soft focus:outline-none focus:ring-2 focus:ring-mint/50 sm:min-w-9 sm:px-3",
  paginationPageActive:
    "inline-flex min-w-8 items-center justify-center rounded-full bg-mint px-2 py-2 text-sm font-semibold text-brand shadow-sm sm:min-w-9 sm:px-3",
  paginationEllipsis: "px-0.5 text-sm text-muted sm:px-1",
  paginationDisabled:
    "shrink-0 rounded-full border border-border bg-surface px-3 py-2 text-sm font-medium text-muted sm:px-5",
  paginationJumpForm: "flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto",
  paginationJumpLabel: "text-sm font-medium text-muted",
  paginationJumpInput:
    "w-20 rounded-full border border-border bg-card px-3 py-2 text-center text-sm text-brand outline-none focus:border-brand focus:ring-2 focus:ring-mint/50",
  alert: "rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-red-800",
  statBox: "rounded-2xl bg-mint-soft px-4 py-3",
  loadingCard:
    "rounded-3xl border border-border bg-card px-6 py-16 text-center shadow-sm",
  loadingPanel:
    "flex flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-card px-6 py-16 shadow-sm",
  tabActive: "rounded-full bg-mint px-5 py-2.5 text-sm font-semibold text-brand shadow-sm",
  tabInactive:
    "rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-brand shadow-sm transition-colors hover:border-brand/30 hover:bg-mint-soft",
  poster: "h-36 w-24 shrink-0 overflow-hidden rounded-2xl bg-mint-soft",
  darkPanel: "rounded-3xl bg-brand-bg p-6 text-white shadow-sm sm:p-8",
  pillOnDark:
    "rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/20",
} as const;

export function mediaBadgeClass(mediaType: MediaType): string {
  return mediaType === "show" ? ui.badgeShow : ui.badgeMovie;
}
