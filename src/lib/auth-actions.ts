'use server';

import { signIn, signOut } from '@/src/lib/auth';
import { AUTH_PROVIDER_ID } from '@/src/lib/auth-urls';

export async function signInAction() {
    await signIn(AUTH_PROVIDER_ID, { redirectTo: '/profile' });
}

export async function signOutAction() {
    await signOut({ redirectTo: '/search' });
}
