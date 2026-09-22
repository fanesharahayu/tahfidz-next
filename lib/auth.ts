import { cookies } from "next/headers";
import * as jose from "jose";

export type Role = "admin" | "musyrif" | "santri" | "wali";

export interface SessionUser {
  id: number;
  username: string;
  nama: string;
  email: string;
  role: Role;
}

const COOKIE_NAME = "tahfidz_session";
const MAX_AGE = 60 * 60 * 8; // 8 jam, sama seperti express-session legacy

function secretKey(): Uint8Array {
  const s = process.env.SESSION_SECRET || "rahasia_sesi_dev_only";
  return new TextEncoder().encode(s);
}

export async function createSession(user: SessionUser): Promise<string> {
  return new jose.SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, secretKey());
    return {
      id: Number(payload.id),
      username: String(payload.username),
      nama: String(payload.nama),
      email: String(payload.email),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function requireSession(roles?: Role[]): Promise<
  { user: SessionUser } | { error: string; status: 401 | 403 }
> {
  const user = await getSession();
  if (!user) return { error: "Silakan login terlebih dahulu", status: 401 };
  if (roles && !roles.includes(user.role))
    return { error: "Anda tidak memiliki akses", status: 403 };
  return { user };
}

export function redirectPath(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "musyrif":
      return "/musyrif";
    case "santri":
      return "/santri";
    case "wali":
      return "/wali";
    default:
      return "/login";
  }
}
