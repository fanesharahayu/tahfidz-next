import { redirect } from "next/navigation";
import { getSession, redirectPath } from "@/lib/auth";
import AppShell from "@/components/app-shell";

export default async function MusyrifLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "musyrif") redirect(redirectPath(user.role));
  return <AppShell user={user}>{children}</AppShell>;
}
