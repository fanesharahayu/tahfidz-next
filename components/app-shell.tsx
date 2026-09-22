"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
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

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  musyrif: "Musyrif",
  santri: "Santri",
  wali: "Wali Santri",
};

function initials(nama: string): string {
  return nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Shell disamakan dengan proyek lama: sidebar gradient emerald + avatar gold.
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
      <aside className="hidden w-[250px] shrink-0 flex-col bg-[linear-gradient(180deg,#115e59,#0f766e)] text-white md:flex">
        <div className="flex items-center gap-2.5 border-b border-white/15 px-5 py-[22px]">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-white/15 text-xl">
            📖
          </div>
          <div>
            <p className="text-base font-semibold">Tahfidz Monitor</p>
            <small className="block text-[11px] opacity-75">Monitoring Hafalan</small>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[10px] px-3.5 py-3 text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white",
                isActive(item.href) && "bg-white/20 font-semibold text-white"
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="border-t border-white/15 px-3 py-4">
          <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#c9a227] text-base font-bold text-[#1e293b]">
              {initials(user.nama)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">{user.nama}</p>
              <p className="text-[11px] opacity-85">{ROLE_LABEL[user.role] ?? user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="mt-2.5 w-full rounded-lg bg-white/10 px-2 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/25 disabled:opacity-50"
          >
            🚪 Keluar
          </button>
        </div>
      </aside>

      {/* Kolom kanan: topbar + konten */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[#e2e8f0] bg-white px-4 py-4 md:px-7">
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#0f766e] text-lg text-white">
              📖
            </div>
            <p className="font-semibold text-[#1e293b]">Tahfidz Monitor</p>
          </div>
          <div className="hidden md:block">
            <p className="text-sm text-[#64748b]">
              {ROLE_LABEL[user.role] ?? user.role} &mdash; {user.nama}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="rounded-[10px] border-[1.5px] border-[#0f766e] bg-transparent px-4 py-2 text-sm font-semibold text-[#0f766e] transition-colors hover:bg-[#0f766e] hover:text-white disabled:opacity-50"
          >
            🚪 Keluar
          </button>
        </header>

        {/* Nav mobile */}
        <nav className="flex gap-2 overflow-x-auto border-b border-[#e2e8f0] bg-white p-2 md:hidden">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-[#1e293b] hover:bg-[#f1f5f9]",
                isActive(item.href) && "bg-[#ccfbf1] font-semibold text-[#115e59]"
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <main className="flex-1 bg-[#f1f5f9] p-4 md:px-7 md:py-[26px]">{children}</main>
      </div>
    </div>
  );
}
