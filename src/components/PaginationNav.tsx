import { getVisiblePages } from "@/src/lib/pagination";
import { ui } from "@/src/lib/ui";

type PaginationNavProps = {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  ariaLabel: string;
  formAction: string;
  formFields: Record<string, string>;
  placement: "top" | "bottom";
};

export default function PaginationNav({
  currentPage,
  totalPages,
  buildHref,
  ariaLabel,
  formAction,
  formFields,
  placement,
}: PaginationNavProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pageItems = getVisiblePages(currentPage, totalPages);
  const jumpInputId = `page-jump-${placement}`;

  return (
    <nav
      className={placement === "top" ? ui.paginationNavTop : ui.paginationNavBottom}
      aria-label={ariaLabel}
    >
      <div className={ui.paginationControls}>
        {currentPage > 1 ? (
          <a href={buildHref(currentPage - 1)} className={`${ui.paginationLink} ${ui.paginationPrev}`}>
            <span className="sm:hidden">Prev</span>
            <span className="hidden sm:inline">Previous</span>
          </a>
        ) : (
          <span className={`${ui.paginationDisabled} ${ui.paginationPrev}`} aria-disabled="true">
            <span className="sm:hidden">Prev</span>
            <span className="hidden sm:inline">Previous</span>
          </span>
        )}

        <ol className={ui.paginationPages} aria-label="Pages">
          {pageItems.map((item, index) =>
            item === "ellipsis" ? (
              <li key={`ellipsis-${placement}-${index}`} className={ui.paginationEllipsis} aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item}>
                {item === currentPage ? (
                  <span className={ui.paginationPageActive} aria-current="page">
                    {item}
                  </span>
                ) : (
                  <a href={buildHref(item)} className={ui.paginationPageLink}>
                    {item}
                  </a>
                )}
              </li>
            ),
          )}
        </ol>

        {currentPage < totalPages ? (
          <a href={buildHref(currentPage + 1)} className={`${ui.paginationLink} ${ui.paginationNext}`}>
            Next
          </a>
        ) : (
          <span className={`${ui.paginationDisabled} ${ui.paginationNext}`} aria-disabled="true">
            Next
          </span>
        )}
      </div>

      <form method="GET" action={formAction} className={ui.paginationJumpForm}>
        {Object.entries(formFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <label htmlFor={jumpInputId} className={ui.paginationJumpLabel}>
          Go to page
        </label>
        <input
          id={jumpInputId}
          name="page"
          type="number"
          min={1}
          max={totalPages}
          defaultValue={currentPage}
          className={ui.paginationJumpInput}
          aria-label={`Go to page, 1 to ${totalPages}`}
        />
        <button type="submit" className={ui.pillSecondary}>
          Go
        </button>
      </form>
    </nav>
  );
}
