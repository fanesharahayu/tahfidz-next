import { clearSessionCookie } from "@/lib/auth";
import { ok } from "@/lib/route-helpers";

export async function POST() {
  await clearSessionCookie();
  return ok({ message: "Logout berhasil" });
}

export async function DELETE() {
  await clearSessionCookie();
  return ok({ message: "Logout berhasil" });
}
