import { getSession } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

/**
 * Wraps a non-2xx fetch response so callers can branch on `instanceof ApiError`
 * and surface the server-supplied body if there is one.
 */
export class ApiError extends Error {
    constructor(
        public status: number,
        public statusText: string,
        public body: string
    ) {
        super(`${status} ${statusText}: ${body}`);
        this.name = 'ApiError';
    }
}

interface ApiOptions {
    /** Optional AbortSignal so callers (e.g. effects) can cancel in-flight requests. */
    signal?: AbortSignal;
}

/**
 * Public GET against `backend-3`. No auth header attached.
 * Use for routes that don't require a token (e.g. `GET /v2/messages`).
 */
export async function apiGet<T = unknown>(path: string, options?: ApiOptions): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, { signal: options?.signal });
    if (!response.ok) {
        throw new ApiError(response.status, response.statusText, await response.text());
    }
    return response.json() as Promise<T>;
}

/**
 * Authenticated request against `backend-3`. Pulls the access token from the
 * NextAuth session cookie (via `getSession()` — the cookie is HTTP-only so we
 * cannot read it directly from `document.cookie`) and attaches it as a
 * `Bearer` token. Throws if the user is not signed in.
 */
export async function apiAuthed<T = unknown>(
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    options?: ApiOptions
): Promise<T> {
    const session = await getSession();
    if (!session?.accessToken) {
        throw new Error('Not signed in');
    }

    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: options?.signal,
    });

    if (!response.ok) {
        throw new ApiError(response.status, response.statusText, await response.text());
    }
    if (response.status === 204) {
        return undefined as T;
    }
    return response.json() as Promise<T>;
}
