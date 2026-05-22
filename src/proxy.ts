import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';

export default auth((request) => {
    if (!request.auth) {
        const signInUrl = new URL('/api/auth/signin', request.url);
        signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
        return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
});

export const config = {
    matcher: [
        '/profile',
        '/dashboard',
        '/messages/view',
        '/messages/view/:id',
        '/messages/send',
        '/debug',
    ],
};
