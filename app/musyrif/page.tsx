"use client";

import { useEffect, useMemo, useState } from "react";
import { get, fmtDate, JENIS_LABEL, NILAI_LABEL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/dialog";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type ProgressData = {
  juzTercapai: number;
  targetJuz: number;
  persenJuz: number;
  totalSetoran: number;
  totalHafalanBaru: number;
  lancar: number;
};

type Binaan = {
  santri_id: number;
  nis: string | null;
  kelas: string | null;
  target_juz: number | null;
  user_id: number;
  nama: string;
  email: string;
  progress: ProgressData;
  setoranCount: number;
};

type Setoran = {
  id: number;
  created_at: string;
  juz: number;
  surah: string | null;
  ayat_awal: number | null;
  ayat_akhir: number | null;
  jenis: string;
  nilai: string;
  santri_nama: string;
  kelas: string | null;
  nis: string | null;
  catatan: string | null;
};

const PIE_COLORS: Record<string, string> = {
  lancar: "#059669",
  cukup_lancar: "#f59e0b",
  perlu_ulang: "#dc2626",
};

function nilaiVariant(nilai: string): "success" | "warning" | "destructive" | "default" {
  if (nilai === "lancar") return "success";
  if (nilai === "cukup_lancar") return "warning";
  if (nilai === "perlu_ulang") return "destructive";
  return "default";
}

function formatAyat(s: Setoran): string {
  const awal = s.ayat_awal ?? 0;
  const akhir = s.ayat_akhir ?? 0;
  if (!awal && !akhir) return "-";
  if (awal === akhir) return String(awal);
  return `${awal}-${akhir}`;
}

export default function MusyrifDashboardPage() {
  const [binaan, setBinaan] = useState<Binaan[]>([]);
  const [riwayat, setRiwayat] = useState<Setoran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [b, r] = await Promise.all([
        get<Binaan[]>("/api/musyrif/santri"),
        get<Setoran[]>("/api/musyrif/setoran"),
      ]);
      setBinaan(b);
      setRiwayat(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const stats = useMemo(() => {
    const jumlahBinaan = binaan.length;
    const totalSetoran = riwayat.length;
    const rataJuz =
      jumlahBinaan === 0
        ? 0
        : Math.round(
            (binaan.reduce((acc, s) => acc + (s.progress?.juzTercapai ?? 0), 0) /
              jumlahBinaan) *
              10
          ) / 10;
    const tuntas = binaan.filter((s) => (s.progress?.persenJuz ?? 0) >= 50).length;
    return { jumlahBinaan, totalSetoran, rataJuz, tuntas };
  }, [binaan, riwayat]);

  const distribusi = useMemo(() => {
    const counts: Record<string, number> = {
      lancar: 0,
      cukup_lancar: 0,
      perlu_ulang: 0,
    };
    for (const s of riwayat) {
      if (s.nilai in counts) counts[s.nilai] += 1;
    }
    return Object.entries(counts).map(([name, value]) => ({
      name: NILAI_LABEL[name] ?? name,
      key: name,
      value,
    }));
  }, [riwayat]);

  const terbaru = useMemo(() => riwayat.slice(0, 8), [riwayat]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard Musyrif</h1>
        <p className="text-sm text-muted-foreground">Memuat data binaan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard Musyrif</h1>
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat data</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={load}>Muat Ulang</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Musyrif</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan santri binaan dan setoran terbaru.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          Muat Ulang
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Jumlah Binaan</CardTitle>
            <CardDescription>Santri di bawah bimbingan Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.jumlahBinaan}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Setoran</CardTitle>
            <CardDescription>Seluruh setoran binaan</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalSetoran}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rata-rata Juz</CardTitle>
            <CardDescription>Rata-rata juz tercapai per santri</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.rataJuz}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tuntas &ge; 50%</CardTitle>
            <CardDescription>Santri dengan progres minimal 50%</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats.tuntas}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {stats.jumlahBinaan}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progres Binaan</CardTitle>
            <CardDescription>Pencapaian juz tiap santri</CardDescription>
          </CardHeader>
          <CardContent>
            {binaan.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada santri binaan.</p>
            ) : (
              <div className="space-y-4">
                {binaan.map((s) => (
                  <div key={s.santri_id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.nama}</span>
                      <span className="text-muted-foreground">
                        {s.progress.juzTercapai}/{s.progress.targetJuz} Juz (
                        {s.progress.persenJuz}%) • {s.setoranCount} setoran
                      </span>
                    </div>
                    <Progress value={s.progress.persenJuz} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Nilai</CardTitle>
            <CardDescription>Perbandingan lancar / cukup lancar / perlu ulang</CardDescription>
          </CardHeader>
          <CardContent>
            {riwayat.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data setoran.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribusi}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      {distribusi.map((d) => (
                        <Cell key={d.key} fill={PIE_COLORS[d.key] ?? "#8884d8"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>8 Setoran Terbaru</CardTitle>
          <CardDescription>Setoran paling akhir dari seluruh binaan</CardDescription>
        </CardHeader>
        <CardContent>
          {terbaru.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada setoran.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Santri</TableHead>
                  <TableHead>Juz</TableHead>
                  <TableHead>Surah</TableHead>
                  <TableHead>Ayat</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Nilai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terbaru.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{fmtDate(s.created_at)}</TableCell>
                    <TableCell>{s.santri_nama}</TableCell>
                    <TableCell>Juz {s.juz}</TableCell>
                    <TableCell>{s.surah ?? "-"}</TableCell>
                    <TableCell>{formatAyat(s)}</TableCell>
                    <TableCell>{JENIS_LABEL[s.jenis] ?? s.jenis}</TableCell>
                    <TableCell>
                      <Badge variant={nilaiVariant(s.nilai)}>
                        {NILAI_LABEL[s.nilai] ?? s.nilai}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
