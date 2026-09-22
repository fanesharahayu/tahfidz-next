// Skema SQLite — port 1:1 dari tahfidz/scripts/seed.js (legacy Express).
// JANGAN ubah tanpa membuat migrasi + update tests/schema-parity.test.ts.
export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    nama TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'santri' CHECK(role IN ('admin','musyrif','santri','wali')),
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`,
  `CREATE TABLE IF NOT EXISTS santri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    musyrif_id INTEGER NULL,
    nis TEXT NULL UNIQUE,
    kelas TEXT NULL,
    target_juz INTEGER NOT NULL DEFAULT 30,
    tanggal_bergabung TEXT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (musyrif_id) REFERENCES users(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS musyrif (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    spesialisasi TEXT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS wali_santri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wali_user_id INTEGER NOT NULL,
    santri_id INTEGER NOT NULL,
    relasi TEXT NULL DEFAULT 'Wali Santri',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(wali_user_id, santri_id),
    FOREIGN KEY (wali_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS target_hafalan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    target_juz INTEGER NOT NULL DEFAULT 1,
    periode TEXT NULL,
    tanggal_mulai TEXT NULL,
    tanggal_selesai TEXT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS setoran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    santri_id INTEGER NOT NULL,
    musyrif_id INTEGER NOT NULL,
    juz INTEGER NOT NULL,
    surah TEXT NULL,
    ayat_awal INTEGER NULL DEFAULT 0,
    ayat_akhir INTEGER NULL DEFAULT 0,
    jenis TEXT NOT NULL DEFAULT 'hafalan_baru' CHECK(jenis IN ('hafalan_baru','tambahan','murajaah')),
    nilai TEXT NOT NULL DEFAULT 'lancar' CHECK(nilai IN ('lancar','cukup_lancar','perlu_ulang')),
    catatan TEXT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE,
    FOREIGN KEY (musyrif_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
];

export const TABLES = [
  "users",
  "santri",
  "musyrif",
  "wali_santri",
  "target_hafalan",
  "setoran",
] as const;

export type TableName = (typeof TABLES)[number];
