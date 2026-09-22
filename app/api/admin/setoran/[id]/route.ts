import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const { id } = await params;
    const { musyrif_id, juz, surah, ayat_awal, ayat_akhir, jenis, nilai, catatan } = await req.json();
    const [result] = await query(
      `UPDATE setoran SET musyrif_id = ?, juz = ?, surah = ?, ayat_awal = ?, ayat_akhir = ?, jenis = ?, nilai = ?, catatan = ?
       WHERE id = ?`,
      [musyrif_id, juz, surah, ayat_awal || 0, ayat_akhir || 0, jenis, nilai, catatan || null, id]
    );
    if ((result[0] as unknown as { affectedRows: number }).affectedRows === 0)
      return fail("Setoran tidak ditemukan", 404);
    return ok({ message: "Setoran diperbarui" });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memperbarui setoran", 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const { id } = await params;
    await query("DELETE FROM setoran WHERE id = ?", [id]);
    return ok({ message: "Setoran dihapus" });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal menghapus setoran", 500);
  }
}
