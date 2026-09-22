import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import { SCHEMA } from "./schema";

type DbRow = Record<string, unknown>;

let _db: Database.Database | null = null;

export function resolveDbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  if (process.env.VERCEL) return path.join("/tmp", "tahfidz.db");
  return path.join(process.cwd(), "data", "tahfidz.db");
}

function hash(p: string): string {
  return bcrypt.hashSync(p, 10);
}

function seedIfEmpty(db: Database.Database): boolean {
  const existing = db.prepare("SELECT COUNT(*) AS total FROM users").get() as {
    total: number;
  };
  if (existing.total > 0) return false;

  const run = (sql: string, params: unknown[] = []) =>
    db.prepare(sql).run(...(params as unknown[]));

  run(
    "INSERT INTO users (username, email, password, nama, role) VALUES (?, ?, ?, ?, ?)",
    ["admin", "admin@pesantren.id", hash("admin123"), "Administrator", "admin"]
  );
  run(
    "INSERT INTO users (username, email, password, nama, role) VALUES (?, ?, ?, ?, ?)",
    ["ust_ahmad", "ahmad@pesantren.id", hash("musyrif123"), "Ust. Ahmad Fauzi, Lc.", "musyrif"]
  );
  run(
    "INSERT INTO users (username, email, password, nama, role) VALUES (?, ?, ?, ?, ?)",
    ["ust_abdullah", "abdullah@pesantren.id", hash("musyrif123"), "Ust. Abdullah Hakim", "musyrif"]
  );

  const musyrifFull = db
    .prepare("SELECT id, username FROM users WHERE role = 'musyrif'")
    .all() as { id: number; username: string }[];
  const ahmadId = musyrifFull.find((m) => m.username === "ust_ahmad")!.id;
  const abdullahId = musyrifFull.find((m) => m.username === "ust_abdullah")!.id;

  run("INSERT INTO musyrif (user_id, spesialisasi) VALUES (?, ?)", [ahmadId, "Tahfidz Putra"]);
  run("INSERT INTO musyrif (user_id, spesialisasi) VALUES (?, ?)", [abdullahId, "Tahfidz Putra"]);

  const santriData = [
    ["ahmad_farhan", "farhan@pesantren.id", hash("santri123"), "Ahmad Farhan"],
    ["muhammad_rizki", "rizki@pesantren.id", hash("santri123"), "Muhammad Rizki"],
    ["abdul_aziz", "aziz@pesantren.id", hash("santri123"), "Abdul Aziz"],
  ];
  for (const s of santriData) {
    run(
      "INSERT INTO users (username, email, password, nama, role) VALUES (?, ?, ?, ?, ?)",
      [...s, "santri"]
    );
  }

  const santriUsers = db
    .prepare("SELECT id, username FROM users WHERE role = 'santri'")
    .all() as { id: number; username: string }[];
  const umap = Object.fromEntries(santriUsers.map((s) => [s.username, s.id]));

  run(
    "INSERT INTO santri (user_id, musyrif_id, nis, kelas, target_juz, tanggal_bergabung) VALUES (?, ?, ?, ?, ?, ?)",
    [umap["ahmad_farhan"], ahmadId, "10", "X-A", 10, "2025-07-14"]
  );
  run(
    "INSERT INTO santri (user_id, musyrif_id, nis, kelas, target_juz, tanggal_bergabung) VALUES (?, ?, ?, ?, ?, ?)",
    [umap["muhammad_rizki"], ahmadId, "11", "X-A", 10, "2025-07-14"]
  );
  run(
    "INSERT INTO santri (user_id, musyrif_id, nis, kelas, target_juz, tanggal_bergabung) VALUES (?, ?, ?, ?, ?, ?)",
    [umap["abdul_aziz"], abdullahId, "12", "X-B", 5, "2025-07-14"]
  );

  run(
    "INSERT INTO users (username, email, password, nama, role) VALUES (?, ?, ?, ?, ?)",
    ["wali_farhan", "walifarhan@gmail.com", hash("wali123"), "H. Bambang Setiawan", "wali"]
  );
  run(
    "INSERT INTO users (username, email, password, nama, role) VALUES (?, ?, ?, ?, ?)",
    ["wali_rizki", "walirizki@gmail.com", hash("wali123"), "Hj. Siti Rahma", "wali"]
  );

  const waliUsers = db
    .prepare("SELECT id, username FROM users WHERE role = 'wali'")
    .all() as { id: number; username: string }[];
  const wmap = Object.fromEntries(waliUsers.map((w) => [w.username, w.id]));

  const santriRows = db.prepare("SELECT id, user_id FROM santri").all() as {
    id: number;
    user_id: number;
  }[];
  const srmap = Object.fromEntries(santriRows.map((s) => [s.user_id, s.id]));

  run("INSERT INTO wali_santri (wali_user_id, santri_id, relasi) VALUES (?, ?, ?)", [
    wmap["wali_farhan"],
    srmap[umap["ahmad_farhan"]],
    "Ayah",
  ]);
  run("INSERT INTO wali_santri (wali_user_id, santri_id, relasi) VALUES (?, ?, ?)", [
    wmap["wali_rizki"],
    srmap[umap["muhammad_rizki"]],
    "Ibu",
  ]);

  run(
    "INSERT INTO target_hafalan (santri_id, target_juz, periode, tanggal_mulai, tanggal_selesai) VALUES (?, ?, ?, ?, ?)",
    [srmap[umap["ahmad_farhan"]], 4, "2025-2026 Semester Ganjil", "2025-07-14", "2025-12-20"]
  );
  run(
    "INSERT INTO target_hafalan (santri_id, target_juz, periode, tanggal_mulai, tanggal_selesai) VALUES (?, ?, ?, ?, ?)",
    [srmap[umap["muhammad_rizki"]], 3, "2025-2026 Semester Ganjil", "2025-07-14", "2025-12-20"]
  );
  run(
    "INSERT INTO target_hafalan (santri_id, target_juz, periode, tanggal_mulai, tanggal_selesai) VALUES (?, ?, ?, ?, ?)",
    [srmap[umap["abdul_aziz"]], 2, "2025-2026 Semester Ganjil", "2025-07-14", "2025-12-20"]
  );

  const setoranData = [
    [srmap[umap["ahmad_farhan"]], ahmadId, 1, "Al-Fatihah", 1, 7, "hafalan_baru", "lancar", "Setoran awal"],
    [srmap[umap["ahmad_farhan"]], ahmadId, 1, "Al-Baqarah", 1, 20, "hafalan_baru", "lancar", ""],
    [srmap[umap["ahmad_farhan"]], ahmadId, 1, "Al-Baqarah", 21, 40, "tambahan", "cukup_lancar", "Perlu murajaah ayat 30-35"],
    [srmap[umap["ahmad_farhan"]], ahmadId, 1, "Al-Baqarah", 1, 40, "murajaah", "lancar", "Murajaah juz 1"],
    [srmap[umap["muhammad_rizki"]], ahmadId, 1, "Al-Fatihah", 1, 7, "hafalan_baru", "lancar", ""],
    [srmap[umap["muhammad_rizki"]], ahmadId, 1, "Al-Baqarah", 1, 15, "hafalan_baru", "cukup_lancar", "Ulangi ayat 10-15"],
    [srmap[umap["abdul_aziz"]], abdullahId, 30, "An-Naba'", 1, 40, "hafalan_baru", "lancar", "Juz 30 lengkap"],
    [srmap[umap["abdul_aziz"]], abdullahId, 30, "An-Nazi'at", 1, 40, "tambahan", "lancar", ""],
  ];
  for (const s of setoranData) {
    run(
      "INSERT INTO setoran (santri_id, musyrif_id, juz, surah, ayat_awal, ayat_akhir, jenis, nilai, catatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      s
    );
  }
  return true;
}

export function getDb(): Database.Database {
  if (_db) return _db;
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  for (const sql of SCHEMA) db.prepare(sql).run();
  seedIfEmpty(db);
  _db = db;
  return _db;
}

// Test helper: buka DB terisolasi (file :memory: atau path sementara)
export function openTestDb(dbPath = ":memory:"): Database.Database {
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  for (const sql of SCHEMA) db.prepare(sql).run();
  return db;
}

// Inti query yang bisa diuji tanpa menyentuh DB asli (pakai openTestDb).
// Kontrak (sama seperti legacy config/db.js):
//   SELECT -> [rows, []]        — rows berupa array
//   INSERT -> [info, []]        — info = {insertId, lastID, affectedRows}
//   UPDATE/DELETE -> [info, []] — info = {affectedRows}
export function queryOn<T = DbRow>(
  db: Database.Database,
  sql: string,
  params: unknown[] = []
): [any, []] {
  const trimmed = sql.trim().toUpperCase();
  if (trimmed.startsWith("INSERT")) {
    const info = db.prepare(sql).run(...(params as unknown[]));
    const lastID = Number(info.lastInsertRowid);
    return [{ insertId: lastID, lastID, affectedRows: info.changes }, []];
  }
  if (trimmed.startsWith("UPDATE") || trimmed.startsWith("DELETE")) {
    const info = db.prepare(sql).run(...(params as unknown[]));
    return [{ affectedRows: info.changes }, []];
  }
  const rows = db.prepare(sql).all(...(params as unknown[])) as T[];
  return [rows || [], []];
}

// Kompat query() ala mysql2 agar porting routes minim: SELECT -> [rows], lain -> [{insertId, affectedRows}]
// Note: first element bisa array (SELECT) atau object (INSERT/UPDATE/DELETE) mengikuti kontrak legacy.
export async function query<T = DbRow>(sql: string, params: unknown[] = []): Promise<[any, []]> {
  return queryOn<T>(getDb(), sql, params);
}

export function querySync<T = DbRow>(sql: string, params: unknown[] = []): T[] {
  const db = getDb();
  return db.prepare(sql).all(...(params as unknown[])) as T[];
}
