import { signIn } from '@/src/lib/auth';
import { AUTH_PROVIDER_ID } from '@/src/lib/auth-urls';

/**
 * Entry point for protected-route redirects. Immediately starts the OIDC
 * flow server-side (Auth.js v5 has no GET sign-in route for this provider).
 */
type LoginPageProps = {
    searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const { callbackUrl = '/profile' } = await searchParams;
    await signIn(AUTH_PROVIDER_ID, { redirectTo: callbackUrl });
}
