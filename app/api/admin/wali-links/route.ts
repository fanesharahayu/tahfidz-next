import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function GET() {
  const auth = await requireSession(["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const [rows] = await query(
      `SELECT ws.id, ws.wali_user_id, ws.santri_id, ws.relasi
       FROM wali_santri ws
       ORDER BY ws.id`
    );
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat relasi", 500);
  }
}
