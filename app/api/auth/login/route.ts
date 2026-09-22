import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { createSession, setSessionCookie, redirectPath, type Role } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) return fail("Username dan password wajib diisi", 400);

    const [rows] = await query("SELECT id, username, email, password, nama, role FROM users WHERE username = ? OR email = ?", [
      username,
      username,
    ]);
    const user = rows[0] as unknown as {
      id: number;
      username: string;
      email: string;
      password: string;
      nama: string;
      role: Role;
    } | undefined;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return fail("Username atau password salah", 401);
    }

    const sessionUser = { id: user.id, username: user.username, nama: user.nama, email: user.email, role: user.role };
    const token = await createSession(sessionUser);
    await setSessionCookie(token);

    return ok({ message: "Login berhasil", user: sessionUser, redirect: redirectPath(user.role) });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Login gagal", 500);
  }
}
