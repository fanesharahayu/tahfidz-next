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
