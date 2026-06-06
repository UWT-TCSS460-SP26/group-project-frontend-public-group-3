import LoadingSpinner from "@/src/components/LoadingSpinner";
import { ui } from "@/src/lib/ui";

export default function DetailsLoading() {
  return (
    <div className={ui.page}>
      <div className={ui.container}>
        <header className="mb-12">
          <p className={ui.eyebrow}>Discover</p>
          <h1 className={ui.title}>Details</h1>
        </header>
        <LoadingSpinner label="Fetching title details" />
      </div>
    </div>
  );
}
