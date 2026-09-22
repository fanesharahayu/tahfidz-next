import { query } from "@/lib/db";
import { ok } from "@/lib/route-helpers";

// GET /api/health — publik, untuk cek kesiapan deploy (Vercel / Docker / Nginx).
export async function GET() {
  try {
    const [users] = await query("SELECT COUNT(*) AS c FROM users");
    const [santri] = await query("SELECT COUNT(*) AS c FROM santri");
    const [setoran] = await query("SELECT COUNT(*) AS c FROM setoran");
    return ok({
      status: "ok",
      time: new Date().toISOString(),
      db: "up",
      counts: {
        users: (users[0] as unknown as { c: number }).c,
        santri: (santri[0] as unknown as { c: number }).c,
        setoran: (setoran[0] as unknown as { c: number }).c,
      },
    });
  } catch (e) {
    return ok(
      { status: "error", time: new Date().toISOString(), db: "down", error: e instanceof Error ? e.message : "DB error" },
      500
    );
  }
}
