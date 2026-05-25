import { Inter, Montserrat } from "next/font/google";

import LoadingSpinner from "@/src/components/LoadingSpinner";
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

export default function SearchLoading() {
  return (
    <div className={`${ui.page} ${inter.className}`}>
      <div className={ui.container}>
        <header className="mb-12">
          <p className={ui.eyebrow}>Discover</p>
          <h1 className={`${ui.title} ${montserrat.className}`}>Search</h1>
        </header>
        <LoadingSpinner label="Loading movies and TV results" />
      </div>
    </div>
  );
}
