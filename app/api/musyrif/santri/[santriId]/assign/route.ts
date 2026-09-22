import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ santriId: string }> }
) {
  const auth = await requireSession(["musyrif"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const { santriId } = await params;
    const santriIdNum = Number(santriId);
    const [santriRows] = await query("SELECT id FROM santri WHERE id = ? AND musyrif_id IS NULL", [
      santriIdNum,
    ]);
    if (santriRows.length === 0)
      return fail("Santri tidak ditemukan atau sudah memiliki musyrif", 404);
    await query("UPDATE santri SET musyrif_id = ? WHERE id = ?", [auth.user.id, santriIdNum]);
    return ok({ message: "Santri berhasil diangkat menjadi binaan Anda" });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal mengambil santri binaan", 500);
  }
}
