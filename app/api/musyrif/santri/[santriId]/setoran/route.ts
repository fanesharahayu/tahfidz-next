import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ santriId: string }> }
) {
  const auth = await requireSession(["musyrif"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const { santriId } = await params;
    const santriIdNum = Number(santriId);
    const { juz, surah, ayat_awal, ayat_akhir, jenis, nilai, catatan } = await req.json();

    const [santriRows] = await query("SELECT id FROM santri WHERE id = ? AND musyrif_id = ?", [
      santriIdNum,
      auth.user.id,
    ]);
    if (santriRows.length === 0) return fail("Santri bukan binaan Anda", 403);

    if (!juz || !surah) {
      return fail("Juz dan surah wajib diisi", 400);
    }
    await query(
      `INSERT INTO setoran (santri_id, musyrif_id, juz, surah, ayat_awal, ayat_akhir, jenis, nilai, catatan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        santriIdNum,
        auth.user.id,
        juz,
        surah,
        ayat_awal || 0,
        ayat_akhir || 0,
        jenis || "hafalan_baru",
        nilai || "lancar",
        catatan || null,
      ]
    );
    return ok({ message: "Setoran berhasil dicatat" }, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal mencatat setoran", 500);
  }
}
