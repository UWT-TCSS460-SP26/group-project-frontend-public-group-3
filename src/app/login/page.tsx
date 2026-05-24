import { signIn } from '@/src/lib/auth';
import { AUTH_PROVIDER_ID } from '@/src/lib/auth-urls';

type LoginPageProps = {
    searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const { callbackUrl = '/profile' } = await searchParams;
    await signIn(AUTH_PROVIDER_ID, { redirectTo: callbackUrl });
}
