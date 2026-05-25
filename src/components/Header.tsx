import { Suspense } from "react";
import Link from "next/link";
import { Inter, Montserrat } from "next/font/google";

import { auth } from "@/src/lib/auth";
import { signInAction, signOutAction } from "@/src/lib/auth-actions";
import SearchBar from "@/src/components/SearchBar";
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

function SearchBarFallback() {
  return (
    <div
      className="h-14 animate-pulse rounded-full bg-mint-soft"
      aria-hidden="true"
    />
  );
}

export default async function Header() {
  const session = await auth();

  return (
    <header
      className={`${ui.header} ${inter.className}`}
    >
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className={`text-xl font-bold tracking-tight text-white ${montserrat.className}`}
            >
              Group 3
            </Link>
            <nav className="flex items-center gap-1" aria-label="Main">
              <Link href="/" className={ui.headerNavLink}>
                Home
              </Link>
              <Link href="/search" className={ui.headerNavLink}>
                Search
              </Link>
              <Link href="/profile" className={ui.headerNavLink}>
                Profile
              </Link>
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {session?.user ? (
              <>
                <span className="max-w-[16rem] truncate text-sm text-mint/90">
                  {session.user.email}
                </span>
                <form action={signOutAction}>
                  <button type="submit" className={ui.pillOnDark}>
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <form action={signInAction}>
                <button type="submit" className={ui.pillMint}>
                  Sign In
                </button>
              </form>
            )}
          </div>
        </div>

        <div className={ui.headerSearchPanel}>
          <Suspense fallback={<SearchBarFallback />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
