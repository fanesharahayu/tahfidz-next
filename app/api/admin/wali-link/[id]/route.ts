import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession(["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const { id } = await params;
    await query("DELETE FROM wali_santri WHERE id = ?", [id]);
    return ok({ message: "Hubungan dihapus" });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal menghapus hubungan", 500);
  }
}
