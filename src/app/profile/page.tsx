import { Inter, Montserrat } from 'next/font/google';
import { redirect } from 'next/navigation';

import { auth } from '@/src/lib/auth';
import { buildLoginPath } from '@/src/lib/auth-urls';
import { decodeJwt } from '@/src/lib/jwt';
import { ui } from '@/src/lib/ui';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
});

const montserrat = Montserrat({
    subsets: ['latin'],
    weight: ['600', '700'],
    display: 'swap',
});

function getRoleFromAccessToken(accessToken: string | undefined): string {
    if (!accessToken) return '—';

    try {
        const { payload } = decodeJwt(accessToken);
        const role = payload.role;
        return role != null ? String(role) : '—';
    } catch {
        return '—';
    }
}

function ProfileField({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
            <dt className={ui.label}>{label}</dt>
            <dd className="break-all text-sm font-medium text-brand sm:text-right">
                {value}
            </dd>
        </div>
    );
}

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect(buildLoginPath('/profile'));
    }

    const email = session.user.email ?? '—';
    const sub = session.user.id ?? '—';
    const role = getRoleFromAccessToken(session.accessToken);

    return (
        <div className={`${ui.page} ${inter.className}`}>
            <div className={ui.container}>
                <header className="mb-12">
                    <p className={ui.eyebrow}>Account</p>
                    <h1 className={`${ui.title} ${montserrat.className}`}>Profile</h1>
                    <p className={ui.subtitle}>
                        You are signed in. Your Auth² session details are below.
                    </p>
                </header>

                <section className={ui.card}>
                    <h2 className={`mb-4 text-lg font-semibold text-brand ${montserrat.className}`}>
                        Session details
                    </h2>
                    <dl>
                        <ProfileField label="Email" value={email} />
                        <ProfileField label="Sub" value={sub} />
                        <ProfileField label="Role" value={role} />
                    </dl>
                </section>
            </div>
        </div>
    );
}
