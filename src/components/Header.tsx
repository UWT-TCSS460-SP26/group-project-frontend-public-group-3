import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import type { Session } from "next-auth";

import { auth } from "@/src/lib/auth";
import { signInAction, signOutAction } from "@/src/lib/auth-actions";
import SearchBar from "@/src/components/SearchBar";
import ThemeToggle from "@/src/components/ThemeToggle";
import { ui } from "@/src/lib/ui";

const inter = Inter({
  subsets: ["latin"],
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

function AuthButtons({ session }: { session: Session | null }) {
  if (session?.user) {
    return (
      <>
        <span className="hidden max-w-[10rem] truncate text-sm text-header-mint/90 lg:inline">
          Hello, {session.user.name}!
        </span>
        <form action={signOutAction}>
          <button type="submit" className={ui.pillOnDark}>
            Sign Out
          </button>
        </form>
      </>
    );
  }

  return (
    <form action={signInAction}>
      <button type="submit" className={ui.pillMint}>
        Sign In
      </button>
    </form>
  );
}

function MainNav({ session }: { session: Session | null }) {
  return (
    <>
      <Link href="/" className={ui.headerNavLink}>
        Home
      </Link>
      <Link href="/search" className={ui.headerNavLink}>
        Search
      </Link>
      {session?.user ? (
        <Link href="/profile" className={ui.headerNavLink}>
          Profile
        </Link>
      ) : (
        <form action={signInAction} className="inline">
          <button type="submit" className={ui.headerNavLink}>
            Profile
          </button>
        </form>
      )}
    </>
  );
}

export default async function Header() {
  const session = await auth();

  return (
    <header className={`${ui.header} ${inter.className}`}>
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="header-shell flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="header-shell__top flex w-full items-center justify-between gap-3">
            <Link href="/" className="header-shell__logo shrink-0">
              <Image
                src="/brand/logo.png"
                alt="Group 3"
                width={395}
                height={71}
                className="header-shell__logo-img h-8 w-auto max-w-[7.5rem] lg:max-w-none"
                priority
              />
            </Link>

            <div className="header-shell__actions flex shrink-0 items-center gap-2 lg:gap-3">
              <ThemeToggle />
              <AuthButtons session={session} />
            </div>
          </div>

          <nav
            className="header-shell__nav flex min-w-0 flex-wrap items-center gap-1"
            aria-label="Main"
          >
            <MainNav session={session} />
          </nav>
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
