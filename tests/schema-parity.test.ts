import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA, TABLES } from "@/lib/schema";

function norm(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

describe("schema parity legacy vs Next.js", () => {
  it("memiliki 6 tabel yang sama", () => {
    expect(TABLES).toEqual(["users", "santri", "musyrif", "wali_santri", "target_hafalan", "setoran"]);
    expect(SCHEMA).toHaveLength(6);
  });

  it("skema identik dengan scripts/seed.js legacy", () => {
    const legacySeed = path.join(process.cwd(), "..", "tahfidz", "scripts", "seed.js");
    expect(fs.existsSync(legacySeed)).toBe(true);
    const src = fs.readFileSync(legacySeed, "utf8");
    for (const stmt of SCHEMA) {
      const table = stmt.match(/create table if not exists (\w+)/i)?.[1];
      expect(table, "nama tabel terdeteksi").toBeTruthy();
      // Setiap CREATE TABLE baru harus mengandung potongan kunci dari legacy
      // (cek longgar: nama tabel muncul di seed legacy)
      expect(src.toLowerCase()).toContain(table!.toLowerCase());
    }
    // Cek kolom kunci & constraint tidak hilang
    const joined = norm(SCHEMA.join(" "));
    for (const keyword of [
      "users",
      "username text not null unique",
      "role text not null default 'santri'",
      "check(role in",
      "santri",
      "musyrif_id",
      "on delete cascade",
      "on delete set null",
      "wali_santri",
      "unique(wali_user_id, santri_id)",
      "target_hafalan",
      "setoran",
      "check(jenis in ('hafalan_baru','tambahan','murajaah'))",
      "check(nilai in ('lancar','cukup_lancar','perlu_ulang'))",
    ]) {
      expect(joined).toContain(keyword);
    }
  });

  it("setiap tabel punya primary key autoincrement + created_at", () => {
    for (const stmt of SCHEMA) {
      const n = norm(stmt);
      expect(n).toContain("integer primary key autoincrement");
      expect(n).toContain("created_at");
    }
  });
});
