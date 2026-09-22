import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getProfile } from "@/lib/helpers";
import { ok, fail } from "@/lib/route-helpers";

export async function GET() {
  const user = await getSession();
  if (!user) return fail("Silakan login terlebih dahulu", 401);
  try {
    const profile = await getProfile(user);
    return ok({ user: { ...user, ...(profile || {}) } });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memuat profil", 500);
  }
}
