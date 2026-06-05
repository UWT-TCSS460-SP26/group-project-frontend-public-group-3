import { Inter, Montserrat } from "next/font/google";

import LoadingSpinner from "@/src/components/LoadingSpinner";
import SkeletonGrid from "@/src/components/SkeletonGrid";
import { ui } from "@/src/lib/ui";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export default function HomeLoading() {
  return (
    <div className={`${ui.page} ${inter.className}`}>
      <div className={ui.container}>
        <header className="mb-12">
          <p className={ui.eyebrow}>Browse</p>
          <h1 className={`${ui.title} ${montserrat.className}`}>
            Popular Movies
          </h1>
        </header>
        <LoadingSpinner label="Fetching popular titles" />
        <SkeletonGrid />
      </div>
    </div>
  );
}
