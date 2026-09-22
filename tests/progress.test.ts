import { describe, it, expect } from "vitest";
import { computeProgress, buildGrafik } from "@/lib/helpers";

describe("computeProgress (port 1:1 legacy)", () => {
  it("menghitung juz distinct non-murajaah", () => {
    const setorans = [
      { juz: 1, jenis: "hafalan_baru", nilai: "lancar" },
      { juz: 1, jenis: "tambahan", nilai: "cukup_lancar" },
      { juz: 1, jenis: "murajaah", nilai: "lancar" },
      { juz: 2, jenis: "hafalan_baru", nilai: "perlu_ulang" },
    ];
    const p = computeProgress(setorans, 30);
    expect(p.juzTercapai).toBe(2); // murajaah tidak dihitung
    expect(p.totalSetoran).toBe(4);
    expect(p.totalHafalanBaru).toBe(2);
    expect(p.lancar).toBe(2);
    expect(p.persenJuz).toBe(Math.min(100, Math.round((2 / 30) * 100)));
  });

  it("default target 30 & cap 100%", () => {
    const many = Array.from({ length: 35 }, (_, i) => ({ juz: i + 1, jenis: "hafalan_baru", nilai: "lancar" }));
    const p = computeProgress(many, 30);
    expect(p.targetJuz).toBe(30);
    expect(p.persenJuz).toBe(100);
    const def = computeProgress([], null);
    expect(def.targetJuz).toBe(30);
    expect(def.persenJuz).toBe(0);
  });

  it("kasus kosong", () => {
    expect(computeProgress([], 10)).toEqual({
      juzTercapai: 0,
      targetJuz: 10,
      persenJuz: 0,
      totalSetoran: 0,
      totalHafalanBaru: 0,
      lancar: 0,
    });
  });
});

describe("buildGrafik (kumulatif juz per tanggal)", () => {
  it("akumulasi juz unik mengabaikan murajaah", () => {
    const setorans = [
      { juz: 1, jenis: "murajaah", nilai: "lancar", created_at: "2025-09-03 10:00:00" },
      { juz: 2, jenis: "hafalan_baru", nilai: "lancar", created_at: "2025-09-02 10:00:00" },
      { juz: 1, jenis: "hafalan_baru", nilai: "lancar", created_at: "2025-09-01 10:00:00" },
    ];
    // input DESC (terbaru dulu) seperti query ORDER BY created_at DESC
    const g = buildGrafik(setorans);
    expect(g).toEqual([
      { tanggal: "2025-09-01", juz: 1 },
      { tanggal: "2025-09-02", juz: 2 },
      { tanggal: "2025-09-03", juz: 2 },
    ]);
  });
});
