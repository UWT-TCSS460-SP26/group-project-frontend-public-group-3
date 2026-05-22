import { Inter, Montserrat } from 'next/font/google';
import { redirect } from 'next/navigation';

import { auth } from '@/src/lib/auth';
import { decodeJwt } from '@/src/lib/jwt';

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
        <div className="flex flex-col gap-1 border-b border-slate-100 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
            </dt>
            <dd className="break-all text-sm font-medium text-[#0f1f3d] sm:text-right">
                {value}
            </dd>
        </div>
    );
}

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/api/auth/signin?callbackUrl=/profile');
    }

    const email = session.user.email ?? '—';
    const sub = session.user.id ?? '—';
    const role = getRoleFromAccessToken(session.accessToken);

    return (
        <div
            className={`min-h-screen bg-slate-50 text-slate-800 ${inter.className}`}
        >
            <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                <header className="mb-10">
                    <p className="mb-2 text-sm font-medium uppercase tracking-wide text-[#5b4bb7]">
                        Account
                    </p>
                    <h1
                        className={`text-3xl font-bold tracking-tight text-[#0f1f3d] sm:text-4xl ${montserrat.className}`}
                    >
                        Profile
                    </h1>
                    <p className="mt-2 max-w-xl text-slate-600">
                        You are signed in. Your Auth² session details are below.
                    </p>
                </header>

                <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                    <h2
                        className={`mb-4 text-lg font-semibold text-[#0f1f3d] ${montserrat.className}`}
                    >
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
