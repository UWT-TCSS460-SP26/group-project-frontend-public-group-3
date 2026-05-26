'use server';

import { signIn, signOut } from '@/src/lib/auth';
import { AUTH_PROVIDER_ID } from '@/src/lib/auth-urls';

/**
 * Server actions that wrap Auth.js `signIn` / `signOut` so forms and other
 * server components can trigger auth without importing client-only APIs.
 * Redirect targets match the defaults used in `AuthButtons` on the client.
 */
export async function signInAction() {
    await signIn(AUTH_PROVIDER_ID, { redirectTo: '/profile' });
}

export async function signOutAction() {
    await signOut({ redirectTo: '/search' });
}
