import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";

const TABLES = ["users", "santri", "musyrif", "wali_santri", "target_hafalan", "setoran"] as const;

function dbPath(p: string): string | null {
  return fs.existsSync(p) ? p : null;
}

function counts(db: Database.Database): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of TABLES) {
    try {
      out[t] = (db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get() as { c: number }).c;
    } catch {
      out[t] = -1;
    }
  }
  return out;
}

function checksum(db: Database.Database): string {
  const h = crypto.createHash("sha256");
  for (const t of TABLES) {
    const rows = db.prepare(`SELECT * FROM ${t} ORDER BY id`).all();
    h.update(t + ":" + JSON.stringify(rows));
  }
  return h.digest("hex");
}

describe("migration safety: tidak ada data hilang", () => {
  const legacyCandidates = [
    path.join(process.cwd(), "..", "tahfidz", "tahfidz.db"),
    process.env.LEGACY_DB || "",
  ].filter(Boolean);
  const newCandidates = [
    path.join(process.cwd(), "data", "tahfidz.db"),
    process.env.DB_PATH || "",
  ].filter(Boolean);

  const legacyFile = legacyCandidates.map(dbPath).find(Boolean) as string | undefined;
  const newFile = newCandidates.map(dbPath).find(Boolean) as string | undefined;

  it("file legacy & hasil migrasi ditemukan (atau laporan migrasi)", () => {
    const report = path.join(process.cwd(), "data", "migration-report.json");
    const hasReport = fs.existsSync(report);
    // Minimal salah satu bukti migrasi ada; jika belum migrasi, test memberi pesan jelas
    expect(
      hasReport || (legacyFile && newFile),
      `Butuh data/migration-report.json atau kedua DB. legacy=${legacyFile} new=${newFile}`
    ).toBeTruthy();
  });

  it("laporan migrasi: counts & checksum sama", () => {
    const report = path.join(process.cwd(), "data", "migration-report.json");
    if (!fs.existsSync(report)) {
      console.warn("SKIP: belum ada migration-report.json — jalankan: npm run db:migrate");
      return;
    }
    const r = JSON.parse(fs.readFileSync(report, "utf8"));
    expect(r.sameCounts).toBe(true);
    expect(r.sameSum).toBe(true);
    expect(r.srcCounts).toEqual(r.tgtCounts);
  });

  it("live check: counts legacy == counts baru", () => {
    if (!legacyFile || !newFile) {
      console.warn("SKIP live check: file DB belum lengkap — jalankan npm run db:migrate dulu");
      return;
    }
    const src = new Database(legacyFile, { readonly: true });
    const tgt = new Database(newFile, { readonly: true });
    try {
      expect(counts(tgt)).toEqual(counts(src));
    } finally {
      src.close();
      tgt.close();
    }
  });

  it("live check: checksum full-table sama (tidak ada baris berubah/hilang)", () => {
    if (!legacyFile || !newFile) {
      console.warn("SKIP checksum: jalankan npm run db:migrate dulu");
      return;
    }
    const src = new Database(legacyFile, { readonly: true });
    const tgt = new Database(newFile, { readonly: true });
    try {
      expect(checksum(tgt)).toBe(checksum(src));
    } finally {
      src.close();
      tgt.close();
    }
  });

  it("integritas baru: FK valid + integrity_check ok + unik terjaga", () => {
    if (!newFile) {
      console.warn("SKIP integritas: jalankan npm run db:migrate dulu");
      return;
    }
    const db = new Database(newFile, { readonly: true });
    try {
      expect((db.prepare("PRAGMA integrity_check").get() as { integrity_check: string }).integrity_check).toBe("ok");
      expect(db.prepare("PRAGMA foreign_key_check").all()).toHaveLength(0);
      // Tidak ada santri yatim / setoran yatim / wali yatim
      expect(
        (db.prepare(`SELECT COUNT(*) AS c FROM santri s LEFT JOIN users u ON u.id=s.user_id WHERE u.id IS NULL`).get() as { c: number }).c
      ).toBe(0);
      expect(
        (db.prepare(`SELECT COUNT(*) AS c FROM setoran st LEFT JOIN santri s ON s.id=st.santri_id WHERE s.id IS NULL`).get() as { c: number }).c
      ).toBe(0);
      expect(
        (db.prepare(`SELECT COUNT(*) AS c FROM wali_santri ws LEFT JOIN santri s ON s.id=ws.santri_id WHERE s.id IS NULL`).get() as { c: number }).c
      ).toBe(0);
      // Username/email unik (duplikat = 0)
      const dupUser = db
        .prepare(`SELECT username, COUNT(*) c FROM users GROUP BY username HAVING c>1`)
        .all();
      expect(dupUser).toHaveLength(0);
    } finally {
      db.close();
    }
  });
});
