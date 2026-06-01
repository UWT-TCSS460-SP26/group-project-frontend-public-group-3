'use client';

import { signIn, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AUTH_PROVIDER_ID } from '@/src/lib/auth-urls';
import { ui } from '@/src/lib/ui';

/** auth-squared access tokens last ~1 hour; warn 5 minutes before expiry. */
const DEFAULT_WARNING_BEFORE_MS = 5 * 60 * 1000;

function getWarningBeforeMs(): number {
    const raw = process.env.NEXT_PUBLIC_SESSION_WARNING_BEFORE_MS;
    if (raw == null || raw === '') {
        return DEFAULT_WARNING_BEFORE_MS;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_WARNING_BEFORE_MS;
}

function formatMinutesRemaining(ms: number): string {
    const minutes = Math.max(1, Math.ceil(ms / 60_000));
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}

type ExpiryState = 'hidden' | 'warning' | 'expired';

export default function SessionExpiryWarning() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [expiryState, setExpiryState] = useState<ExpiryState>('hidden');
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const expiredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimers = useCallback(() => {
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
            warningTimerRef.current = null;
        }
        if (expiredTimerRef.current) {
            clearTimeout(expiredTimerRef.current);
            expiredTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        clearTimers();
        setExpiryState('hidden');

        if (status !== 'authenticated') {
            return;
        }

        const expiresAt = session?.accessTokenExpires;
        if (expiresAt == null) {
            return;
        }

        const warningBeforeMs = getWarningBeforeMs();
        const now = Date.now();
        const msUntilExpiry = expiresAt - now;
        const msUntilWarning = msUntilExpiry - warningBeforeMs;

        const showWarning = () => setExpiryState('warning');
        const showExpired = () => setExpiryState('expired');

        if (msUntilExpiry <= 0) {
            showExpired();
            return;
        }

        if (msUntilWarning <= 0) {
            showWarning();
            expiredTimerRef.current = setTimeout(showExpired, msUntilExpiry);
            return clearTimers;
        }

        warningTimerRef.current = setTimeout(showWarning, msUntilWarning);
        expiredTimerRef.current = setTimeout(showExpired, msUntilExpiry);

        return clearTimers;
    }, [status, session?.accessTokenExpires, clearTimers]);

    if (expiryState === 'hidden') {
        return null;
    }

    const isExpired = expiryState === 'expired';
    const expiresAt = session?.accessTokenExpires;
    const msRemaining =
        expiresAt != null ? Math.max(0, expiresAt - Date.now()) : 0;

    const title = isExpired ? 'Session expired' : 'Session expiring soon';
    const message = isExpired
        ? 'Your session has expired. Sign in again to continue using your account.'
        : `Your session expires in about ${formatMinutesRemaining(msRemaining)}. Sign in again to stay signed in.`;

    const handleSignIn = () => {
        void signIn(AUTH_PROVIDER_ID, { callbackUrl: pathname || '/profile' });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-brand/40 p-4 backdrop-blur-sm"
            role="presentation"
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="session-expiry-title"
                aria-describedby="session-expiry-message"
                className={`w-full max-w-md ${ui.card} shadow-lg`}
            >
                <h2 id="session-expiry-title" className="text-lg font-semibold text-brand">
                    {title}
                </h2>
                <p id="session-expiry-message" className="mt-2 text-sm leading-relaxed text-muted">
                    {message}
                </p>
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    {!isExpired && (
                        <button
                            type="button"
                            onClick={() => setExpiryState('hidden')}
                            className={ui.pillSecondary}
                        >
                            Continue
                        </button>
                    )}
                    <button type="button" onClick={handleSignIn} className={ui.pillPrimary}>
                        Sign in again
                    </button>
                </div>
            </div>
        </div>
    );
}
