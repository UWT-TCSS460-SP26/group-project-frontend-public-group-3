import LoadingSpinner from "@/src/components/LoadingSpinner";
import { ui } from "@/src/lib/ui";

export default function SearchLoading() {
  return (
    <div className={ui.page}>
      <div className={ui.container}>
        <header className="mb-12">
          <p className={ui.eyebrow}>Discover</p>
          <h1 className={ui.title}>Search</h1>
        </header>
        <LoadingSpinner label="Loading movies and TV results" />
      </div>
    </div>
  );
}
