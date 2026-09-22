import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function POST(req: Request) {
  const auth = await requireSession(["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const { santri_id, musyrif_id, juz, surah, ayat_awal, ayat_akhir, jenis, nilai, catatan } =
      await req.json();
    if (!santri_id || !musyrif_id || !juz || !surah)
      return fail("Santri, musyrif, juz, dan surah wajib diisi", 400);
    const [santriRows] = await query("SELECT id FROM santri WHERE id = ?", [santri_id]);
    if (santriRows.length === 0) return fail("Santri tidak ditemukan", 404);
    const [pengajarRows] = await query("SELECT id FROM users WHERE id = ? AND role = ?", [musyrif_id, "musyrif"]);
    if (pengajarRows.length === 0) return fail("Musyrif tidak ditemukan", 404);
    const [result] = await query(
      `INSERT INTO setoran (santri_id, musyrif_id, juz, surah, ayat_awal, ayat_akhir, jenis, nilai, catatan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [santri_id, musyrif_id, juz, surah, ayat_awal || 0, ayat_akhir || 0, jenis || "hafalan_baru", nilai || "lancar", catatan || null]
    );
    return ok(
      { message: "Setoran dicatat", id: (result[0] as unknown as { lastID: number }).lastID },
      201
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal mencatat setoran", 500);
  }
}
