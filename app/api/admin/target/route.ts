import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function POST(req: Request) {
  const auth = await requireSession(["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const { santri_id, target_juz, periode, tanggal_mulai, tanggal_selesai } = await req.json();
    if (!santri_id || !target_juz) return fail("Santri dan target juz wajib diisi", 400);
    const [result] = await query(
      `INSERT INTO target_hafalan (santri_id, target_juz, periode, tanggal_mulai, tanggal_selesai)
       VALUES (?, ?, ?, ?, ?)`,
      [santri_id, target_juz, periode || null, tanggal_mulai || null, tanggal_selesai || null]
    );
    await query("UPDATE santri SET target_juz = ? WHERE id = ?", [target_juz, santri_id]);
    return ok(
      { message: "Target hafalan disimpan", id: (result[0] as unknown as { lastID: number }).lastID },
      201
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal menyimpan target", 500);
  }
}
