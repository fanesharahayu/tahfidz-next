import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function POST(req: Request) {
  const auth = await requireSession(["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const { nama, username, email, password, nis, kelas, target_juz, musyrif_id, tanggal_bergabung } =
      await req.json();
    if (!nama || !username || !email || !password)
      return fail("Field nama, username, email, password wajib diisi", 400);
    const [exists] = await query("SELECT id FROM users WHERE username = ? OR email = ?", [username, email]);
    if (exists.length > 0) return fail("Username atau email sudah ada", 400);
    const hash = bcrypt.hashSync(password, 10);
    const [result] = await query(
      "INSERT INTO users (username, email, password, nama, role) VALUES (?, ?, ?, ?, ?)",
      [username, email, hash, nama, "santri"]
    );
    const id = (result as unknown as { lastID: number }).lastID;
    await query(
      `INSERT INTO santri (user_id, nis, kelas, target_juz, musyrif_id, tanggal_bergabung)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nis || null, kelas || null, target_juz || 30, musyrif_id || null, tanggal_bergabung || null]
    );
    return ok({ message: "Santri berhasil ditambahkan", id }, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal menambah santri", 500);
  }
}
