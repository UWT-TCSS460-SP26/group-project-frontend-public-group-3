import { ui } from "@/src/lib/ui";

type LoadingSpinnerProps = {
  label: string;
};

export default function LoadingSpinner({ label }: LoadingSpinnerProps) {
  return (
    <div className={ui.loadingPanel} role="status" aria-live="polite">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-mint-soft border-t-brand"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-brand">{label}</p>
    </div>
  );
}
