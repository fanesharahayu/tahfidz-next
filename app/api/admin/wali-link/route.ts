import { query } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ok, fail } from "@/lib/route-helpers";

export async function POST(req: Request) {
  const auth = await requireSession(["admin"]);
  if ("error" in auth) return fail(auth.error, auth.status);
  try {
    const { wali_user_id, santri_id, relasi } = await req.json();
    if (!wali_user_id || !santri_id) return fail("Wali dan santri wajib dipilih", 400);
    await query("INSERT INTO wali_santri (wali_user_id, santri_id, relasi) VALUES (?, ?, ?)", [
      wali_user_id,
      santri_id,
      relasi || "Wali Santri",
    ]);
    return ok({ message: "Hubungan wali-santri dibuat" }, 201);
  } catch {
    return fail("Hubungan sudah ada atau data tidak valid", 400);
  }
}
