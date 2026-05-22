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

export default function SearchLoading() {
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
            Search
          </h1>
        </header>
        <div
          className="rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-sm"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-[#5b4bb7]">Searching…</p>
          <p className="mt-2 text-sm text-slate-500">
            Loading movies and TV results
          </p>
        </div>
      </div>
    </div>
  );
}
