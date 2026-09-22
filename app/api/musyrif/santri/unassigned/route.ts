import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function GET() {
  const auth = await requireSession(["musyrif"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const [rows] = await query(
      `SELECT s.id AS santri_id, s.nis, s.kelas, s.tanggal_bergabung,
              u.id AS user_id, u.nama, u.email
       FROM santri s
       JOIN users u ON u.id = s.user_id
       WHERE s.musyrif_id IS NULL
       ORDER BY u.nama`
    );
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat santri", 500);
  }
}
