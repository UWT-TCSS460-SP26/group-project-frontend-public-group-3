'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

import SessionExpiryWarning from '@/src/components/SessionExpiryWarning';

/**
 * Client-side wrapper for NextAuth's SessionProvider so client components
 * can call `useSession()`. Mount inside the root layout.
 */
export default function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider refetchInterval={60}>
            <SessionExpiryWarning />
            {children}
        </SessionProvider>
    );
}
