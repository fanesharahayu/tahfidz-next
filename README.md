# Tahfidz Monitoring — Next.js (refactor dari Express)

Hasil refactor dari `../tahfidz` (Node.js + Express + SQLite + vanilla JS)
ke **Next.js 16 App Router + TailwindCSS v4 + shadcn/ui + SQLite (`better-sqlite3`)**.

Proyek lama **tidak dihapus** — refactor di folder baru ini agar migrasi bisa diverifikasi.

## Tech stack

- Next.js 16 App Router (Route Handlers untuk `/api/*`, Server Components untuk guard role)
- TailwindCSS v4 + komponen gaya shadcn/ui (`components/ui/*`: button, card, input, badge, table, dialog, tabs, dsb.)
- SQLite file via `better-sqlite3` (DB sama, skema 1:1 dengan legacy)
- Session JWT (`jose`, cookie httpOnly `tahfidz_session`, 8 jam) pengganti `express-session`
- Charts `recharts` (pengganti Chart.js), ikon `lucide-react`
- Unit test `vitest` (56 test)

## Jalankan

```bash
npm install
cp .env.example .env   # isi SESSION_SECRET dengan string acak panjang
npm run db:migrate      # salin ../tahfidz/tahfidz.db -> ./data/tahfidz.db + verifikasi
npm run dev             # http://localhost:3000
```

Akun demo (sama seperti legacy):

| Peran   | Username       | Password     |
| ------- | -------------- | ------------ |
| Admin   | `admin`        | `admin123`   |
| Musyrif | `ust_ahmad`    | `musyrif123` |
| Santri  | `ahmad_farhan` | `santri123`  |
| Wali    | `wali_farhan`  | `wali123`    |

## Struktur

```
app/
  login/ register/ profil/
  admin/                       # overview 7 tab
  musyrif/                     # dashboard, santri-binaan, riwayat-setoran, target-hafalan, relasi-wali
  santri/ wali/
  api/
    auth/login|logout|me|register|santri
    admin/stats|users|santri|target|wali-links|wali-link|setoran
    musyrif/walis|wali-links|wali-link|targets|target|santri|setoran
    santri/dashboard  wali/children|child/[santriId]
lib/
  schema.ts                    # SCHEMA 1:1 dari scripts/seed.js legacy
  db.ts                        # better-sqlite3 + query() kompatibel mysql2 + auto-seed
  auth.ts                      # JWT session + requireSession + redirectPath
  helpers.ts                   # getProfile + computeProgress + buildGrafik (port helper.js)
  api.ts                       # fetch client + fmtDate + label
components/
  ui/                          # shadcn-style: button, card, input, label, badge, table, dialog
  app-shell.tsx                # sidebar + topbar per role
scripts/migrate-from-legacy.mjs # migrasi aman + checksum
tests/                         # 5 file, 56 test
  schema-parity, progress, auth, api-parity, migration-safety
data/
  tahfidz.db                   # hasil migrasi (gitignored)
  migration-report.json        # bukti counts + checksum sama
```

## Migrasi data (aman, tanpa kehilangan)

```bash
npm run db:migrate          # menolak menimpa target berisi data
npm run db:migrate:force    # timpa paksa (perlu sadar)
```

Script memeriksa: `integrity_check=ok`, `foreign_key_check=0`,
row counts 6 tabel sama, SHA-256 full-table sama, lalu menulis
`data/migration-report.json`. Hasil terakhir:

- `users:11, santri:4, musyrif:3, wali_santri:3, target_hafalan:3, setoran:9`
- checksum `b97d5891…` identik sumber vs target.

## Unit test

```bash
npm test   # vitest run — 56 test harus lolos
```

- `schema-parity`: 6 tabel + constraint CHECK/UNIQUE/FK sama dengan legacy
- `progress`: computeProgress + buildGrafik setara helper.js
- `auth`: bcrypt roundtrip + JWT + redirectPath + kontrak 401/403
- `api-parity`: 34 route handler + 11 halaman ada & guard role benar
- `migration-safety`: counts + checksum + FK + orphan + unik (perlu hasil migrasi)

## Catatan porting

- Session berpindah dari `express-session` (server memory) ke JWT stateless —
  semua user wajib login ulang sekali, password/hash tetap valid.
- Redirect berubah dari `/pages/...html` ke rute App Router (`/admin`, `/musyrif`, ...).
- `database.sql` (MySQL) tetap arsip; sumber kebenaran skema = `lib/schema.ts` ≈ `scripts/seed.js` legacy.
- Backup legacy: `../tahfidz/tahfidz.db.pre-migration.bak` + `legacy-snapshot.json`.
