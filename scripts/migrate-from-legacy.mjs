#!/usr/bin/env node
/**
 * Migrasi aman tahfidz.db legacy (Express) -> tahfidz-next (Next.js).
 *
 * - Sumber default: ../tahfidz/tahfidz.db (bisa override LEGACY_DB)
 * - Target default: ./data/tahfidz.db (bisa override DB_PATH)
 * - Tidak pernah menimpa target berisi data tanpa --force
 * - Verifikasi: skema 6 tabel, row counts sama, FK check, integrity_check, checksum sampel
 *
 * Cara pakai:
 *   node scripts/migrate-from-legacy.mjs
 *   node scripts/migrate-from-legacy.mjs --force
 *   LEGACY_DB=/path/lama.db DB_PATH=/path/baru.db node scripts/migrate-from-legacy.mjs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(path.join(root, "package.json"));

const force = process.argv.includes("--force");
const legacyDb = process.env.LEGACY_DB || path.join(root, "..", "tahfidz", "tahfidz.db");
const targetDb = process.env.DB_PATH || path.join(root, "data", "tahfidz.db");

const TABLES = ["users", "santri", "musyrif", "wali_santri", "target_hafalan", "setoran"];

function loadBetterSqlite3() {
  try {
    return require("better-sqlite3");
  } catch {
    console.error("better-sqlite3 belum terinstall. Jalankan: npm install");
    process.exit(1);
  }
}

function counts(db) {
  const out = {};
  for (const t of TABLES) {
    try {
      out[t] = db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
    } catch {
      out[t] = -1;
    }
  }
  return out;
}

function checksum(db) {
  const h = crypto.createHash("sha256");
  for (const t of TABLES) {
    const rows = db.prepare(`SELECT * FROM ${t} ORDER BY id`).all();
    h.update(t + ":" + JSON.stringify(rows));
  }
  return h.digest("hex");
}

async function main() {
  console.log("=== Migrasi Tahfidz DB ===");
  console.log("Sumber :", legacyDb);
  console.log("Target :", targetDb);

  if (!fs.existsSync(legacyDb)) {
    console.error(`DB legacy tidak ditemukan: ${legacyDb}`);
    console.error("Set LEGACY_DB ke path yang benar.");
    process.exit(1);
  }

  const Database = loadBetterSqlite3();

  // Snapshot sumber (read-only)
  const src = new Database(legacyDb, { readonly: true });
  const srcCounts = counts(src);
  const srcChecksum = checksum(src);
  const integrity = src.prepare("PRAGMA integrity_check").get();
  const fk = src.prepare("PRAGMA foreign_key_check").all();
  console.log("Sumber counts:", JSON.stringify(srcCounts));
  console.log("Sumber checksum:", srcChecksum);
  console.log("Sumber integrity:", integrity?.integrity_check);
  console.log("Sumber FK violations:", fk.length);
  src.close();

  if (integrity?.integrity_check !== "ok" || fk.length > 0) {
    console.error("DB sumber korup / FK rusak. Batalkan migrasi, perbaiki dulu.");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(targetDb), { recursive: true });

  if (fs.existsSync(targetDb) && !force) {
    const tgt = new Database(targetDb, { readonly: true });
    const tgtCounts = counts(tgt);
    tgt.close();
    const hasData = Object.values(tgtCounts).some((c) => c > 0);
    if (hasData) {
      console.error("Target sudah berisi data:", JSON.stringify(tgtCounts));
      console.error("Batal demi keamanan. Gunakan --force untuk menimpa, atau hapus file target manual.");
      process.exit(2);
    }
  }

  if (fs.existsSync(targetDb) && force) {
    for (const ext of ["", "-shm", "-wal", "-journal"]) {
      try {
        if (fs.existsSync(targetDb + ext)) fs.unlinkSync(targetDb + ext);
      } catch {}
    }
  }

  // Salin file (WAL-safe: checkpoint dulu via koneksi biasa)
  const Database2 = Database;
  const srcRw = new Database2(legacyDb);
  try {
    srcRw.pragma("wal_checkpoint(TRUNCATE)");
  } catch {}
  srcRw.close();

  fs.copyFileSync(legacyDb, targetDb);
  console.log("File disalin.");

  // Verifikasi target
  const tgt = new Database(targetDb);
  tgt.pragma("journal_mode = WAL");
  tgt.pragma("foreign_keys = ON");
  const tgtCounts = counts(tgt);
  const tgtChecksum = checksum(tgt);
  const tgtIntegrity = tgt.prepare("PRAGMA integrity_check").get();
  const tgtFk = tgt.prepare("PRAGMA foreign_key_check").all();
  tgt.close();

  console.log("Target counts:", JSON.stringify(tgtCounts));
  console.log("Target checksum:", tgtChecksum);
  console.log("Target integrity:", tgtIntegrity?.integrity_check);
  console.log("Target FK violations:", tgtFk.length);

  const sameCounts = JSON.stringify(srcCounts) === JSON.stringify(tgtCounts);
  const sameSum = srcChecksum === tgtChecksum;

  // Tulis laporan snapshot untuk unit test
  const report = {
    migratedAt: new Date().toISOString(),
    legacyDb,
    targetDb,
    srcCounts,
    tgtCounts,
    srcChecksum,
    tgtChecksum,
    sameCounts,
    sameSum,
  };
  fs.writeFileSync(path.join(root, "data", "migration-report.json"), JSON.stringify(report, null, 2));

  if (!sameCounts || !sameSum) {
    console.error("MIGRASI GAGAL: counts/checksum tidak sama — tidak ada data yang hilang?");
    process.exit(3);
  }
  if (tgtIntegrity?.integrity_check !== "ok" || tgtFk.length > 0) {
    console.error("MIGRASI GAGAL: target korup.");
    process.exit(3);
  }

  console.log("MIGRASI BERHASIL: semua data sama, tidak ada kehilangan.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
