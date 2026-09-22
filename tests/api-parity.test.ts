import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// 39 endpoint legacy (Express) harus punya padanan Route Handler Next.js.
const EXPECTED_ROUTES = [
  "app/api/auth/login/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/auth/me/route.ts",
  "app/api/auth/register/route.ts",
  "app/api/auth/santri/route.ts",
  "app/api/admin/stats/route.ts",
  "app/api/admin/users/route.ts",
  "app/api/admin/users/[id]/route.ts",
  "app/api/admin/santri/route.ts",
  "app/api/admin/santri/[id]/route.ts",
  "app/api/admin/target/route.ts",
  "app/api/admin/target/[id]/route.ts",
  "app/api/admin/wali-links/route.ts",
  "app/api/admin/wali-link/route.ts",
  "app/api/admin/wali-link/[id]/route.ts",
  "app/api/admin/setoran/route.ts",
  "app/api/admin/setoran/[id]/route.ts",
  "app/api/musyrif/walis/route.ts",
  "app/api/musyrif/wali-links/route.ts",
  "app/api/musyrif/wali-link/route.ts",
  "app/api/musyrif/wali-link/[id]/route.ts",
  "app/api/musyrif/targets/route.ts",
  "app/api/musyrif/target/route.ts",
  "app/api/musyrif/target/[id]/route.ts",
  "app/api/musyrif/santri/route.ts",
  "app/api/musyrif/santri/unassigned/route.ts",
  "app/api/musyrif/santri/[santriId]/route.ts",
  "app/api/musyrif/santri/[santriId]/assign/route.ts",
  "app/api/musyrif/santri/[santriId]/setoran/route.ts",
  "app/api/musyrif/setoran/route.ts",
  "app/api/musyrif/setoran/[id]/route.ts",
  "app/api/santri/dashboard/route.ts",
  "app/api/wali/children/route.ts",
  "app/api/wali/child/[santriId]/route.ts",
];

describe("api parity: semua endpoint legacy ada padanannya", () => {
  for (const r of EXPECTED_ROUTES) {
    it(r, () => {
      expect(fs.existsSync(r), `${r} harus ada`).toBe(true);
    });
  }

  it("setiap route memakai requireSession + guard role", () => {
    const roleMap: Record<string, string> = {
      "app/api/admin/": 'requireSession(["admin"])',
      "app/api/musyrif/": 'requireSession(["musyrif"])',
      "app/api/santri/": 'requireSession(["santri"])',
      "app/api/wali/": 'requireSession(["wali"])',
    };
    for (const r of EXPECTED_ROUTES) {
      if (r.includes("/api/auth/")) continue; // auth punya kontrak sendiri
      const src = fs.readFileSync(r, "utf8");
      expect(src).toContain("requireSession");
      for (const [prefix, guard] of Object.entries(roleMap)) {
        if (r.startsWith(prefix)) expect(src).toContain(guard);
      }
    }
  });

  it("route auth publik yang benar tetap publik (login/register/santri-list)", () => {
    for (const r of [
      "app/api/auth/login/route.ts",
      "app/api/auth/register/route.ts",
      "app/api/auth/santri/route.ts",
    ]) {
      const src = fs.readFileSync(r, "utf8");
      expect(src).not.toContain("requireSession");
    }
  });

  it("UI pages ada untuk semua role", () => {
    for (const p of [
      "app/login/page.tsx",
      "app/register/page.tsx",
      "app/admin/page.tsx",
      "app/musyrif/page.tsx",
      "app/musyrif/santri-binaan/page.tsx",
      "app/musyrif/riwayat-setoran/page.tsx",
      "app/musyrif/target-hafalan/page.tsx",
      "app/musyrif/relasi-wali/page.tsx",
      "app/santri/page.tsx",
      "app/wali/page.tsx",
      "app/profil/page.tsx",
    ]) {
      expect(fs.existsSync(p), `${p} harus ada`).toBe(true);
    }
  });
});
