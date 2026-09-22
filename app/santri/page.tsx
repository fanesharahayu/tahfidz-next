"use client";

import { useEffect, useState } from "react";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Setoran = {
  id: number;
  created_at: string;
  juz: number;
  surah: string | null;
  ayat_awal: number | null;
  ayat_akhir: number | null;
  jenis: string;
  nilai: string;
  musyrif_nama: string | null;
  catatan: string | null;
};

type Target = {
  id: number;
  target_juz: number;
  periode: string | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
};

type ProgressData = {
  juzTercapai: number;
  targetJuz: number;
  persenJuz: number;
  totalSetoran: number;
  lancar: number;
};

type GrafikPoint = {
  tanggal: string;
  juz: number;
};

type Dashboard = {
  santri: Record<string, unknown> & {
    nama?: string;
    nis?: string;
    kelas?: string;
    musyrif_nama?: string;
  };
  setoran: Setoran[];
  targets: Target[];
  progress: ProgressData;
  grafik: GrafikPoint[];
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

export default function SantriDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await get<Dashboard>("/api/santri/dashboard");
      setData(res);
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

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard Santri</h1>
        <p className="text-sm text-muted-foreground">Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard Santri</h1>
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat data</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={load}>Coba Lagi</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { santri, setoran, targets, progress, grafik } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Santri</h1>
        <p className="text-sm text-muted-foreground">
          {String(santri.nama ?? "-")}
          {santri.nis ? ` • NIS ${String(santri.nis)}` : ""}
          {santri.kelas ? ` • Kelas ${String(santri.kelas)}` : ""}
          {santri.musyrif_nama ? ` • Musyrif: ${String(santri.musyrif_nama)}` : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Juz Tercapai</CardTitle>
            <CardDescription>Total juz unik (di luar murajaah)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{progress.juzTercapai}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Target Juz</CardTitle>
            <CardDescription>Target hafalan keseluruhan</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{progress.targetJuz}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Setoran</CardTitle>
            <CardDescription>Seluruh riwayat setoran</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{progress.totalSetoran}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lancar</CardTitle>
            <CardDescription>Setoran bernilai lancar</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{progress.lancar}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progres Hafalan</CardTitle>
          <CardDescription>
            {progress.juzTercapai} dari {progress.targetJuz} juz ({progress.persenJuz}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress.persenJuz} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grafik Perkembangan</CardTitle>
          <CardDescription>Akumulasi juz tercapai per tanggal</CardDescription>
        </CardHeader>
        <CardContent>
          {grafik.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada data grafik.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={grafik}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tanggal" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="juz" name="Juz" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Target Hafalan</CardTitle>
          <CardDescription>Daftar target yang ditetapkan musyrif</CardDescription>
        </CardHeader>
        <CardContent>
          {targets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada target.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target Juz</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Tanggal Mulai</TableHead>
                  <TableHead>Tanggal Selesai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.target_juz} Juz</TableCell>
                    <TableCell>{t.periode ?? "-"}</TableCell>
                    <TableCell>{fmtDate(t.tanggal_mulai)}</TableCell>
                    <TableCell>{fmtDate(t.tanggal_selesai)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Setoran</CardTitle>
          <CardDescription>Setoran terbaru ke terlama</CardDescription>
        </CardHeader>
        <CardContent>
          {setoran.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada setoran.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Juz</TableHead>
                  <TableHead>Surah</TableHead>
                  <TableHead>Ayat</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Musyrif</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {setoran.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{fmtDate(s.created_at)}</TableCell>
                    <TableCell>Juz {s.juz}</TableCell>
                    <TableCell>{s.surah ?? "-"}</TableCell>
                    <TableCell>{formatAyat(s)}</TableCell>
                    <TableCell>{JENIS_LABEL[s.jenis] ?? s.jenis}</TableCell>
                    <TableCell>
                      <Badge variant={nilaiVariant(s.nilai)}>
                        {NILAI_LABEL[s.nilai] ?? s.nilai}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.musyrif_nama ?? "-"}</TableCell>
                    <TableCell>{s.catatan ?? "-"}</TableCell>
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
