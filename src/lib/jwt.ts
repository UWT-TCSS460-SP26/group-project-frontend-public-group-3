export interface DecodedJwt {
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    signature: string;
}

function base64UrlDecode(input: string): string {
    const padded = input
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(input.length + ((4 - (input.length % 4)) % 4), '=');
    if (typeof window !== 'undefined') {
        return decodeURIComponent(
            atob(padded)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
    }
    return Buffer.from(padded, 'base64').toString('utf-8');
}

export function decodeJwt(token: string): DecodedJwt {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Malformed JWT: expected 3 parts');
    }
    const [headerB64, payloadB64, signature] = parts;
    return {
        header: JSON.parse(base64UrlDecode(headerB64)) as Record<string, unknown>,
        payload: JSON.parse(base64UrlDecode(payloadB64)) as Record<string, unknown>,
        signature,
    };
}

export function formatExp(exp: unknown): string {
    if (typeof exp !== 'number') return 'n/a';
    return new Date(exp * 1000).toLocaleString();
}
