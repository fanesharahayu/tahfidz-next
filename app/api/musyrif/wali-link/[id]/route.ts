import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(["musyrif"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const { id } = await params;
    const [result] = await query(
      `DELETE FROM wali_santri WHERE id = ? AND santri_id IN (SELECT id FROM santri WHERE musyrif_id = ?)`,
      [id, auth.user.id]
    );
    if ((result as unknown as { affectedRows: number }).affectedRows === 0) {
      return fail("Hubungan tidak ditemukan", 404);
    }
    return ok({ message: "Hubungan dihapus" });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal menghapus hubungan", 500);
  }
}
