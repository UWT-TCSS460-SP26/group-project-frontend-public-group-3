import { decodeJwt } from "@/src/lib/jwt";

export function getRoleFromAccessToken(accessToken: string | undefined): string {
  if (!accessToken) return "—";
  try {
    const { payload } = decodeJwt(accessToken);
    const role = payload.role;
    return role != null ? String(role) : "—";
  } catch {
    return "—";
  }
}

export function getDisplayUsername(
  name: string | null | undefined,
  email: string | null | undefined,
  accessToken: string | undefined,
): string {
  if (name?.trim()) return name.trim();
  if (accessToken) {
    try {
      const { payload } = decodeJwt(accessToken);
      const preferred = payload.preferred_username ?? payload.username;
      if (typeof preferred === "string" && preferred.trim()) {
        return preferred.trim();
      }
    } catch {
      // fall through
    }
  }
  if (email?.trim()) {
    const local = email.split("@")[0];
    if (local) return local;
  }
  return "there";
}
