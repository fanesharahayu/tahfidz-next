import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function GET() {
  const auth = await requireSession(["musyrif"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const [rows] = await query(
      `SELECT ws.id, ws.wali_user_id, ws.santri_id, ws.relasi,
              w.nama AS wali_nama, u.nama AS santri_nama, s.kelas
       FROM wali_santri ws
       JOIN santri s ON s.id = ws.santri_id
       JOIN users w ON w.id = ws.wali_user_id
       JOIN users u ON u.id = s.user_id
       WHERE s.musyrif_id = ?
       ORDER BY u.nama`,
      [auth.user.id]
    );
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat relasi wali-santri", 500);
  }
}
