import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function GET() {
  const auth = await requireSession(["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const [santri] = await query(
      `SELECT s.*, u.nama, u.username, u.email, mu.nama AS musyrif_nama
       FROM santri s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN users mu ON mu.id = s.musyrif_id
       ORDER BY s.kelas, u.nama`
    );
    const [setoran] = await query(
      `SELECT s.id, s.santri_id, s.musyrif_id, s.juz, s.surah, s.ayat_awal, s.ayat_akhir, s.jenis, s.nilai, s.catatan, s.created_at,
              u.nama AS santri_nama, m.nama AS musyrif_nama
       FROM setoran s
       JOIN santri st ON st.id = s.santri_id
       JOIN users u ON u.id = st.user_id
       JOIN users m ON m.id = s.musyrif_id
       ORDER BY s.created_at DESC`
    );
    const [target] = await query(
      `SELECT t.*, u.nama AS santri_nama
       FROM target_hafalan t
       JOIN santri s ON s.id = t.santri_id
       JOIN users u ON u.id = s.user_id
       ORDER BY t.created_at DESC`
    );
    const [users] = await query("SELECT id, nama, role, username, email FROM users ORDER BY role");
    const u = users as unknown as { role: string }[];
    return ok({
      jumlahSantri: santri.length,
      jumlahSetoran: setoran.length,
      jumlahMusyrif: u.filter((x) => x.role === "musyrif").length,
      jumlahWali: u.filter((x) => x.role === "wali").length,
      santri,
      setoran,
      target,
      users,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat stats", 500);
  }
}
