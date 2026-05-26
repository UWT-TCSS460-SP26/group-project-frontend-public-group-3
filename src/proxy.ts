import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { buildLoginPath } from '@/src/lib/auth-urls';

/**
 * Route guard: unauthenticated visitors on protected paths are sent to
 * `/login` with a `callbackUrl` so they return here after OIDC completes.
 */
export default auth((request) => {
    if (!request.auth) {
        return NextResponse.redirect(
            new URL(buildLoginPath(request.nextUrl.pathname), request.url),
        );
    }
    return NextResponse.next();
});

/** Only these paths require a session; public routes (e.g. `/search`) are omitted. */
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
