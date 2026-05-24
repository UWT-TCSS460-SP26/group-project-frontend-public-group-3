import Link from 'next/link';
import { Inter, Montserrat } from 'next/font/google';

import { auth } from '@/src/lib/auth';
import { signInAction, signOutAction } from '@/src/lib/auth-actions';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
});

const montserrat = Montserrat({
    subsets: ['latin'],
    weight: ['600', '700'],
    display: 'swap',
});

const navLinkClass =
    'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#0f1f3d]';

const primaryButtonClass =
    'rounded-xl bg-[#0f1f3d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1a335c] focus:outline-none focus:ring-2 focus:ring-[#5b4bb7]/40 focus:ring-offset-2';

const secondaryButtonClass =
    'rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0f1f3d] shadow-sm transition-colors hover:border-[#5b4bb7]/40 hover:text-[#5b4bb7] focus:outline-none focus:ring-2 focus:ring-[#5b4bb7]/40 focus:ring-offset-2';

export default async function Header() {
    const session = await auth();

    return (
        <header
            className={`border-b border-slate-200/80 bg-white/95 backdrop-blur ${inter.className}`}
        >
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6">
                    <Link
                        href="/search"
                        className={`text-lg font-bold tracking-tight text-[#0f1f3d] ${montserrat.className}`}
                    >
                        Group 3
                    </Link>
                    <nav className="flex items-center gap-1" aria-label="Main">
                        <Link href="/search" className={navLinkClass}>
                            Search
                        </Link>
                        {session?.user ? (
                            <Link href="/profile" className={navLinkClass}>
                                Profile
                            </Link>
                        ) : (
                            <form action={signInAction} className="inline">
                                <button type="submit" className={navLinkClass}>
                                    Profile
                                </button>
                            </form>
                        )}
                    </nav>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {session?.user ? (
                        <>
                            <span className="max-w-[16rem] truncate text-sm text-slate-600">
                                {session.user.email}
                            </span>
                            <form action={signOutAction}>
                                <button type="submit" className={secondaryButtonClass}>
                                    Sign Out
                                </button>
                            </form>
                        </>
                    ) : (
                        <form action={signInAction}>
                            <button type="submit" className={primaryButtonClass}>
                                Sign In
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </header>
    );
}
