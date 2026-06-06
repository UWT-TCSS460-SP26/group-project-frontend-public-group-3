import { ui } from "@/src/lib/ui";

export default function DetailsNotFound() {
  return (
    <div className={ui.page}>
      <div className={ui.container}>
        <header className="mb-12">
          <p className={ui.eyebrow}>Discover</p>
          <h1 className={ui.title}>Not found</h1>
        </header>
        <section className={ui.emptyState}>
          <p className={ui.emptyStateTitle}>
            404 Not Found
          </p>
          <p className="mt-2 text-sm text-muted">
            This title may have been removed from TMDB or the id may be incorrect.
          </p>
          <a href="/search" className={`mt-6 inline-block ${ui.pillSecondary}`}>
            Back to search
          </a>
        </section>
      </div>
    </div>
  );
}
