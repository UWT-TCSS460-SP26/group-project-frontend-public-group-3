"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { signInAction, signOutAction } from "@/src/lib/auth-actions";
import { ui } from "@/src/lib/ui";

export function HeaderAuthButtons() {
  const { data: session } = useSession();

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

export function HeaderMainNav() {
  const { data: session } = useSession();

  return (
    <>
      <Link href="/" className={ui.headerNavLink}>
        Home
      </Link>
      <Link href="/search" className={ui.headerNavLink}>
        Search
      </Link>
      <Link href="/about" className={ui.headerNavLink}>
        About
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
