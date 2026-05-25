/** NextAuth provider id — must match auth-squared callback: /api/auth/callback/tcss460 */
export const AUTH_PROVIDER_ID = 'tcss460';

/**
 * Auth.js v5 does not support GET /api/auth/signin/{provider} (throws UnknownAction).
 * Use /login, which runs signIn() server-side via POST.
 */
export function buildLoginPath(callbackUrl: string): string {
    const params = new URLSearchParams({ callbackUrl });
    return `/login?${params.toString()}`;
}
