import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function GET() {
  const auth = await requireSession(["musyrif"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const [rows] = await query(
      "SELECT id, nama, username, email FROM users WHERE role = 'wali' ORDER BY nama"
    );
    return ok(rows);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat daftar wali", 500);
  }
}
