import 'next-auth';
import 'next-auth/jwt';

/** Extends Auth.js types so tokens copied in `auth.ts` callbacks are typed on Session/JWT. */
declare module 'next-auth' {
    interface Session {
        accessToken?: string;
        idToken?: string;
        accessTokenExpires?: number;
        user?: {
            id?: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string;
        idToken?: string;
        accessTokenExpires?: number;
    }
}
