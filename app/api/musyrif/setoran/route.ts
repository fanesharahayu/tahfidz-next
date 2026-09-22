import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function GET() {
  const auth = await requireSession(["musyrif"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const [rows] = await query(
      `SELECT st.*, u.nama AS santri_nama, s.kelas, s.nis
       FROM setoran st
       JOIN santri s ON s.id = st.santri_id
       JOIN users u ON u.id = s.user_id
       WHERE st.musyrif_id = ?
       ORDER BY st.created_at DESC`,
      [auth.user.id]
    );
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat setoran", 500);
  }
}
