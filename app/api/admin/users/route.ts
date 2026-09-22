import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function GET() {
  const auth = await requireSession(["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const [rows] = await query("SELECT id, nama, username, email, role FROM users ORDER BY role, nama");
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat users", 500);
  }
}

export async function POST(req: Request) {
  const auth = await requireSession(["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const { nama, username, email, password, role } = await req.json();
    if (!nama || !username || !email || !password) return fail("Semua field wajib diisi", 400);
    if (!["admin", "musyrif", "santri", "wali"].includes(role)) return fail("Role tidak valid", 400);
    const [exists] = await query("SELECT id FROM users WHERE username = ? OR email = ?", [username, email]);
    if (exists.length > 0) return fail("Username atau email sudah ada", 400);
    const hash = bcrypt.hashSync(password, 10);
    const [result] = await query(
      "INSERT INTO users (username, email, password, nama, role) VALUES (?, ?, ?, ?, ?)",
      [username, email, hash, nama, role]
    );
    const id = (result as unknown as { lastID: number }).lastID;
    if (role === "musyrif") await query("INSERT INTO musyrif (user_id) VALUES (?)", [id]);
    else if (role === "santri") await query("INSERT INTO santri (user_id) VALUES (?)", [id]);
    return ok({ message: "User berhasil dibuat", id }, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal membuat user", 500);
  }
}
