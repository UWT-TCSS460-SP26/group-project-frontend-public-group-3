'use server';

import { signIn, signOut } from '@/src/lib/auth';

export async function signInAction() {
    await signIn('tcss460', { redirectTo: '/profile' });
}

export async function signOutAction() {
    await signOut({ redirectTo: '/search' });
}
