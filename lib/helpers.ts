import { query } from "./db";
import type { SessionUser } from "./auth";

export interface SetoranRow {
  id?: number;
  juz: number;
  jenis: string;
  nilai: string;
  created_at?: string;
  [k: string]: unknown;
}

export async function getProfile(user: SessionUser) {
  if (user.role === "santri") {
    const [rows] = await query(
      `SELECT s.*, u.nama, u.email, mu.nama AS musyrif_nama
       FROM santri s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN users mu ON mu.id = s.musyrif_id
       WHERE s.user_id = ?`,
      [user.id]
    );
    return (rows[0] as Record<string, unknown> | undefined) ?? null;
  }
  if (user.role === "musyrif") {
    const [rows] = await query(
      `SELECT m.*, u.nama, u.email
       FROM musyrif m
       JOIN users u ON u.id = m.user_id
       WHERE m.user_id = ?`,
      [user.id]
    );
    return (rows[0] as Record<string, unknown> | undefined) ?? null;
  }
  return user;
}

// Port 1:1 dari utils/helper.js legacy — dijaga oleh tests/progress.test.ts
export function computeProgress(setorans: SetoranRow[], targetJuz?: number | null) {
  const distinctJuz = new Set(
    setorans.filter((s) => s.jenis !== "murajaah").map((s) => s.juz)
  );
  const juzTercapai = distinctJuz.size;
  const totalSetoran = setorans.length;
  const totalHafalanBaru = setorans.filter((s) => s.jenis === "hafalan_baru").length;
  const lancar = setorans.filter((s) => s.nilai === "lancar").length;
  const target = targetJuz || 30;
  return {
    juzTercapai,
    targetJuz: target,
    persenJuz: target ? Math.min(100, Math.round((juzTercapai / target) * 100)) : 0,
    totalSetoran,
    totalHafalanBaru,
    lancar,
  };
}

export function buildGrafik(setorans: SetoranRow[]): { tanggal: string; juz: number }[] {
  const byTanggal: Record<string, number> = {};
  const juzSet = new Set<number>();
  const asc = [...setorans].reverse();
  for (const s of asc) {
    if (s.jenis !== "murajaah") juzSet.add(Number(s.juz));
    const t = String(s.created_at ?? "").slice(0, 10);
    if (t) byTanggal[t] = juzSet.size;
  }
  return Object.entries(byTanggal).map(([tanggal, juz]) => ({ tanggal, juz }));
}
