import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";
import { computeProgress, type SetoranRow } from "@/lib/helpers";

export async function GET() {
  const auth = await requireSession(["musyrif"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const [rows] = await query<Record<string, unknown>>(
      `SELECT s.id AS santri_id, s.nis, s.kelas, s.target_juz, s.tanggal_bergabung,
              u.id AS user_id, u.nama, u.email
       FROM santri s
       JOIN users u ON u.id = s.user_id
       WHERE s.musyrif_id = ?
       ORDER BY u.nama`,
      [auth.user.id]
    );
    for (const s of rows) {
      const [setoran] = await query<Record<string, unknown>>(
        "SELECT * FROM setoran WHERE santri_id = ?",
        [s.santri_id as number]
      );
      s.progress = computeProgress(
        setoran as unknown as SetoranRow[],
        (s.target_juz as number | null) ?? undefined
      );
      s.setoranCount = setoran.length;
    }
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat santri binaan", 500);
  }
}

export async function POST(req: Request) {
  const auth = await requireSession(["musyrif"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const { nama, username, email, password, nis, kelas, target_juz } = await req.json();
    if (!nama || !username || !email || !password) {
      return fail("Nama, username, email, dan password wajib diisi", 400);
    }
    if (password.length < 6) {
      return fail("Password minimal 6 karakter", 400);
    }
    const [exists] = await query("SELECT id FROM users WHERE username = ? OR email = ?", [
      username,
      email,
    ]);
    if (exists.length > 0) {
      return fail("Username atau email sudah terdaftar", 400);
    }

    const hash = bcrypt.hashSync(password, 10);
    const [result] = await query(
      "INSERT INTO users (username, email, password, nama, role) VALUES (?, ?, ?, ?, ?)",
      [username, email, hash, nama, "santri"]
    );
    const userId = (result as unknown as { lastID: number }).lastID;
    await query(
      "INSERT INTO santri (user_id, musyrif_id, nis, kelas, target_juz) VALUES (?, ?, ?, ?, ?)",
      [userId, auth.user.id, nis || null, kelas || null, Number(target_juz) || 30]
    );
    return ok({ message: "Santri berhasil ditambahkan ke binaan Anda", id: userId }, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal menambah santri", 500);
  }
}
