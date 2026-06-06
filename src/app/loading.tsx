import LoadingSpinner from "@/src/components/LoadingSpinner";
import SkeletonGrid from "@/src/components/SkeletonGrid";
import { ui } from "@/src/lib/ui";

export default function HomeLoading() {
  return (
    <div className={ui.page}>
      <div className={ui.container}>
        <header className="mb-12">
          <p className={ui.eyebrow}>Browse</p>
          <h1 className={ui.title}>Popular Movies</h1>
        </header>
        <LoadingSpinner label="Fetching popular titles" />
        <SkeletonGrid />
      </div>
    </div>
  );
}
