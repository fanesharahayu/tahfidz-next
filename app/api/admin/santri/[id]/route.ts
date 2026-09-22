import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const { id } = await params;
    const santriId = Number(id);
    const { nis, kelas, target_juz, musyrif_id, tanggal_bergabung, nama } = await req.json();
    await query(
      `UPDATE santri SET nis = ?, kelas = ?, target_juz = ?, musyrif_id = ?, tanggal_bergabung = ?
       WHERE id = ?`,
      [nis || null, kelas || null, target_juz || 30, musyrif_id || null, tanggal_bergabung || null, santriId]
    );
    if (nama) {
      const [santriRow] = await query("SELECT user_id FROM santri WHERE id = ?", [santriId]);
      if (santriRow.length > 0) {
        await query("UPDATE users SET nama = ? WHERE id = ?", [
          nama,
          (santriRow[0] as unknown as { user_id: number }).user_id,
        ]);
      }
    }
    return ok({ message: "Santri berhasil diperbarui" });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memperbarui santri", 500);
  }
}
