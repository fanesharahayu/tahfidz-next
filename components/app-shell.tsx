"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { post } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
}

function navForRole(role: string): NavItem[] {
  switch (role) {
    case "admin":
      return [{ label: "Overview", href: "/admin" }];
    case "musyrif":
      return [
        { label: "Dashboard", href: "/musyrif" },
        { label: "Santri Binaan", href: "/musyrif/santri-binaan" },
        { label: "Riwayat Setoran", href: "/musyrif/riwayat-setoran" },
        { label: "Target", href: "/musyrif/target-hafalan" },
        { label: "Relasi Wali", href: "/musyrif/relasi-wali" },
      ];
    case "santri":
      return [{ label: "Dashboard", href: "/santri" }];
    case "wali":
      return [{ label: "Dashboard", href: "/wali" }];
    default:
      return [];
  }
}

function initials(nama: string): string {
  return nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AppShell({
  user,
  children,
}: {
  user: { nama: string; role: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const nav = [...navForRole(user.role), { label: "Profil", href: "/profil" }];

  const isActive = (href: string) =>
    pathname === href || (href !== "/profil" && pathname.startsWith(href + "/"));

  async function handleLogout() {
    setLoading(true);
    try {
      await post("/api/auth/logout", {});
    } catch {
      // tetap redirect meski request gagal
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="w-64 border-r hidden md:flex flex-col">
        <div className="p-4 border-b">
          <p className="font-semibold">Tahfidz Monitoring</p>
          <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                isActive(item.href) && "bg-accent text-accent-foreground font-medium"
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="p-4 border-t flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            {initials(user.nama)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.nama}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={loading}>
            Keluar
          </Button>
        </div>
      </aside>

      {/* Kolom kanan: topbar + konten */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between gap-3 border-b p-4">
          <p className="font-semibold md:hidden">Tahfidz Monitoring</p>
          <p className="hidden md:block text-sm text-muted-foreground capitalize">
            {user.role} &mdash; {user.nama}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {initials(user.nama)}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} disabled={loading}>
              Keluar
            </Button>
          </div>
        </header>

        {/* Nav mobile */}
        <nav className="flex gap-2 overflow-x-auto border-b p-2 md:hidden">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm hover:bg-accent",
                isActive(item.href) && "bg-accent font-medium"
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <main className="flex-1 p-6 bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
