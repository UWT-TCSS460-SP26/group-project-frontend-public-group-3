import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { buildLoginPath } from '@/src/lib/auth-urls';

export default auth((request) => {
    if (!request.auth) {
        return NextResponse.redirect(
            new URL(buildLoginPath(request.nextUrl.pathname), request.url),
        );
    }
    return NextResponse.next();
});

export const config = {
    matcher: [
        '/profile',
        '/dashboard',
        '/debug',
    ],
};
