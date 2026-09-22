import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { ok, fail } from "@/lib/route-helpers";

export async function GET() {
  try {
    const [rows] = await query(
      `SELECT s.id AS santri_id, u.nama, s.nis, s.kelas
       FROM santri s
       JOIN users u ON u.id = s.user_id
       ORDER BY u.nama`
    );
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat santri", 500);
  }
}

export async function POST(req: Request) {
  try {
    const { nama, username, email, password, role, nis, kelas, spesialisasi, relasi, santri_id } =
      await req.json();
    if (!nama || !username || !email || !password) return fail("Semua field wajib diisi", 400);
    const validRoles = ["musyrif", "santri", "wali"];
    const userRole = validRoles.includes(role) ? role : "santri";
    if (String(password).length < 6) return fail("Password minimal 6 karakter", 400);

    const [exists] = await query("SELECT id FROM users WHERE username = ? OR email = ?", [username, email]);
    if (exists.length > 0) return fail("Username atau email sudah terdaftar", 400);

    const hash = bcrypt.hashSync(password, 10);
    const [result] = await query(
      "INSERT INTO users (username, email, password, nama, role) VALUES (?, ?, ?, ?, ?)",
      [username, email, hash, nama, userRole]
    );
    const userId = (result as unknown as { lastID: number }).lastID;

    if (userRole === "santri") {
      await query("INSERT INTO santri (user_id, musyrif_id, nis, kelas) VALUES (?, ?, ?, ?)", [
        userId,
        null,
        nis || null,
        kelas || null,
      ]);
    } else if (userRole === "musyrif") {
      await query("INSERT INTO musyrif (user_id, spesialisasi) VALUES (?, ?)", [userId, spesialisasi || null]);
    } else if (userRole === "wali" && santri_id) {
      await query("INSERT INTO wali_santri (wali_user_id, santri_id, relasi) VALUES (?, ?, ?)", [
        userId,
        santri_id,
        relasi || "Wali Santri",
      ]);
    }

    return ok({ message: "Registrasi berhasil. Silakan login.", userId, redirect: "/login" }, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Registrasi gagal", 500);
  }
}
