import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

import { HeaderAuthButtons, HeaderMainNav } from "@/src/components/HeaderAuth";
import SearchBar from "@/src/components/SearchBar";
import ThemeToggle from "@/src/components/ThemeToggle";
import { ui } from "@/src/lib/ui";

function SearchBarFallback() {
  return (
    <div
      className="h-14 animate-pulse rounded-full bg-mint-soft"
      aria-hidden="true"
    />
  );
}

export default function Header() {
  return (
    <header className={ui.header}>
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
              <HeaderAuthButtons />
            </div>
          </div>

          <nav
            className="header-shell__nav flex min-w-0 flex-wrap items-center gap-1"
            aria-label="Main"
          >
            <HeaderMainNav />
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
