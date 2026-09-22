import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";
import { computeProgress, buildGrafik, type SetoranRow } from "@/lib/helpers";

export async function GET() {
  const auth = await requireSession(["santri"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const [santriRows] = await query<Record<string, unknown>>(
      `SELECT s.*, u.nama, u.email, mu.nama AS musyrif_nama
       FROM santri s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN users mu ON mu.id = s.musyrif_id
       WHERE s.user_id = ?`,
      [auth.user.id]
    );
    if (santriRows.length === 0) return fail("Data santri tidak ditemukan", 404);
    const santri = santriRows[0];

    const [setoran] = await query<Record<string, unknown>>(
      `SELECT st.*, u.nama AS musyrif_nama
       FROM setoran st
       JOIN users u ON u.id = st.musyrif_id
       WHERE st.santri_id = ?
       ORDER BY st.created_at DESC`,
      [santri.id as number]
    );
    const [targets] = await query<Record<string, unknown>>(
      "SELECT * FROM target_hafalan WHERE santri_id = ? ORDER BY created_at DESC",
      [santri.id as number]
    );

    const setoranRows = setoran as unknown as SetoranRow[];
    return ok({
      santri,
      setoran,
      targets,
      progress: computeProgress(
        setoranRows,
        (santri.target_juz as number | null) ?? undefined
      ),
      grafik: buildGrafik(setoranRows),
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat dashboard santri", 500);
  }
}
