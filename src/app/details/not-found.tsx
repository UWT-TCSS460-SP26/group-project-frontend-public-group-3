import { Inter, Montserrat } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export default function DetailsNotFound() {
  return (
    <div
      className={`min-h-screen bg-slate-50 text-slate-800 ${inter.className}`}
    >
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-[#5b4bb7]">
            Discover
          </p>
          <h1
            className={`text-3xl font-bold tracking-tight text-[#0f1f3d] sm:text-4xl ${montserrat.className}`}
          >
            Not found
          </h1>
        </header>
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
          <p
            className={`text-lg font-semibold text-[#0f1f3d] ${montserrat.className}`}
          >
            404 Not Found
          </p>
          <p className="mt-2 text-sm text-slate-500">
            This title may have been removed from TMDB or the id may be incorrect.
          </p>
          <a
            href="/search"
            className="mt-6 inline-block rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0f1f3d] shadow-sm transition-colors hover:border-[#5b4bb7]/40 hover:text-[#5b4bb7]"
          >
            Back to search
          </a>
        </section>
      </div>
    </div>
  );
}
