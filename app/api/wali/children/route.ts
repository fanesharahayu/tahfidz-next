import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";
import { computeProgress, type SetoranRow } from "@/lib/helpers";

export async function GET() {
  const auth = await requireSession(["wali"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const [rows] = await query<Record<string, unknown>>(
      `SELECT ws.relasi, s.id AS santri_id, s.nis, s.kelas, s.target_juz,
              u.nama, u.email, mu.nama AS musyrif_nama
       FROM wali_santri ws
       JOIN santri s ON s.id = ws.santri_id
       JOIN users u ON u.id = s.user_id
       LEFT JOIN users mu ON mu.id = s.musyrif_id
       WHERE ws.wali_user_id = ?
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
      const [targets] = await query<Record<string, unknown>>(
        "SELECT * FROM target_hafalan WHERE santri_id = ? ORDER BY created_at DESC LIMIT 1",
        [s.santri_id as number]
      );
      s.targetAktif = targets[0] ?? null;
    }
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat data anak", 500);
  }
}
