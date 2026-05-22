'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

const primaryButtonClass =
    'rounded-xl bg-[#0f1f3d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1a335c]';

const secondaryButtonClass =
    'rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0f1f3d] shadow-sm transition-colors hover:border-[#5b4bb7]/40 hover:text-[#5b4bb7]';

export function SignInButton({ callbackUrl = '/profile' }: { callbackUrl?: string }) {
    return (
        <button
            type="button"
            onClick={() => signIn('tcss460', { callbackUrl })}
            className={primaryButtonClass}
        >
            Sign In
        </button>
    );
}

export function SignOutButton() {
    return (
        <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/search' })}
            className={secondaryButtonClass}
        >
            Sign Out
        </button>
    );
}

export function UserBadge() {
    const { data: session, status } = useSession();
    if (status === 'loading') return <span className="text-sm text-slate-500">...</span>;
    if (status === 'unauthenticated') return <SignInButton />;
    return (
        <span className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-600">{session?.user?.email}</span>
            <SignOutButton />
        </span>
    );
}
