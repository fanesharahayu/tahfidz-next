import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";
import { computeProgress, buildGrafik, type SetoranRow } from "@/lib/helpers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ santriId: string }> }
) {
  const auth = await requireSession(["wali"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const { santriId } = await params;
    const santriIdNum = Number(santriId);

    const [links] = await query<Record<string, unknown>>(
      "SELECT relasi FROM wali_santri WHERE wali_user_id = ? AND santri_id = ?",
      [auth.user.id, santriIdNum]
    );
    if (links.length === 0)
      return fail("Anda tidak memiliki akses ke santri ini", 403);
    const link = links[0];

    const [santriRows] = await query<Record<string, unknown>>(
      `SELECT s.*, u.nama, u.email, mu.nama AS musyrif_nama
       FROM santri s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN users mu ON mu.id = s.musyrif_id
       WHERE s.id = ?`,
      [santriIdNum]
    );
    if (santriRows.length === 0) return fail("Data santri tidak ditemukan", 404);
    const santri = santriRows[0];

    const [setoran] = await query<Record<string, unknown>>(
      `SELECT st.*, u.nama AS musyrif_nama
       FROM setoran st
       JOIN users u ON u.id = st.musyrif_id
       WHERE st.santri_id = ?
       ORDER BY st.created_at DESC`,
      [santriIdNum]
    );
    const [targets] = await query<Record<string, unknown>>(
      "SELECT * FROM target_hafalan WHERE santri_id = ? ORDER BY created_at DESC",
      [santriIdNum]
    );

    const setoranRows = setoran as unknown as SetoranRow[];
    return ok({
      relasi: link.relasi,
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
    return fail(e instanceof Error ? e.message : "Gagal memuat detail santri", 500);
  }
}
