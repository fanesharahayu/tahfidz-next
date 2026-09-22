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

type Anak = {
  santri_id: number;
  nama: string;
  nis: string | null;
  kelas: string | null;
  target_juz: number | null;
  musyrif_nama: string | null;
  relasi: string | null;
  progress: {
    juzTercapai: number;
    targetJuz: number;
    persenJuz: number;
    totalSetoran: number;
    lancar: number;
  } | null;
  setoranCount: number;
  targetAktif: {
    target_juz: number;
    periode: string | null;
    tanggal_mulai: string | null;
    tanggal_selesai: string | null;
  } | null;
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

type ChildDetail = {
  relasi: string | null;
  santri: Record<string, unknown> & {
    nama?: string;
    nis?: string;
    kelas?: string;
    musyrif_nama?: string;
  };
  setoran: Setoran[];
  targets: Target[];
  progress: {
    juzTercapai: number;
    targetJuz: number;
    persenJuz: number;
    totalSetoran: number;
    lancar: number;
  };
  grafik: { tanggal: string; juz: number }[];
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

export default function WaliDashboardPage() {
  const [children, setChildren] = useState<Anak[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ChildDetail | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  async function loadChildren() {
    setLoadingChildren(true);
    setError(null);
    try {
      const res = await get<Anak[]>("/api/wali/children");
      setChildren(res);
      if (res.length > 0 && selectedId === null) {
        setSelectedId(res[0].santri_id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data anak");
    } finally {
      setLoadingChildren(false);
    }
  }

  async function loadDetail(id: number) {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const res = await get<ChildDetail>(`/api/wali/child/${id}`);
      setDetail(res);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Gagal memuat detail anak");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedId !== null) loadDetail(selectedId);
  }, [selectedId]);

  const selected = children.find((a) => a.santri_id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Wali</h1>
        <p className="text-sm text-muted-foreground">
          Pantau perkembangan hafalan anak Anda.
        </p>
      </div>

      {loadingChildren ? (
        <p className="text-sm text-muted-foreground">Memuat data anak...</p>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat data</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadChildren}>Coba Lagi</Button>
          </CardContent>
        </Card>
      ) : children.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Belum ada anak terhubung</CardTitle>
            <CardDescription>
              Hubungi musyrif/admin untuk menautkan akun wali dengan santri.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children.map((a) => (
            <Card
              key={a.santri_id}
              className={
                a.santri_id === selectedId
                  ? "cursor-pointer border-primary ring-1 ring-primary"
                  : "cursor-pointer hover:border-primary/60"
              }
              onClick={() => setSelectedId(a.santri_id)}
            >
              <CardHeader>
                <CardTitle>{a.nama}</CardTitle>
                <CardDescription>
                  {a.nis ? `NIS ${a.nis}` : "NIS -"}
                  {a.kelas ? ` • Kelas ${a.kelas}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {a.relasi ?? "Wali Santri"}
                  {a.musyrif_nama ? ` • Musyrif: ${a.musyrif_nama}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span>
                    {a.progress ? `${a.progress.juzTercapai}/${a.progress.targetJuz} Juz` : "-"}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span>{a.setoranCount} setoran</span>
                </div>
                {a.progress && <Progress value={a.progress.persenJuz} />}
                {a.targetAktif && (
                  <p className="text-xs text-muted-foreground">
                    Target aktif: {a.targetAktif.target_juz} Juz
                    {a.targetAktif.periode ? ` (${a.targetAktif.periode})` : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedId === null ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Pilih anak untuk melihat detail
            </p>
          </CardContent>
        </Card>
      ) : loadingDetail ? (
        <p className="text-sm text-muted-foreground">Memuat detail anak...</p>
      ) : detailError ? (
        <Card>
          <CardHeader>
            <CardTitle>Gagal memuat detail</CardTitle>
            <CardDescription>{detailError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => selectedId !== null && loadDetail(selectedId)}>
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      ) : detail ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">
              {String(detail.santri.nama ?? selected?.nama ?? "-")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {detail.relasi ?? selected?.relasi ?? "Wali Santri"}
              {detail.santri.nis ? ` • NIS ${String(detail.santri.nis)}` : ""}
              {detail.santri.kelas ? ` • Kelas ${String(detail.santri.kelas)}` : ""}
              {detail.santri.musyrif_nama
                ? ` • Musyrif: ${String(detail.santri.musyrif_nama)}`
                : ""}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Juz Tercapai</CardTitle>
                <CardDescription>Total juz unik (di luar murajaah)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{detail.progress.juzTercapai}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Target Juz</CardTitle>
                <CardDescription>Target hafalan keseluruhan</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{detail.progress.targetJuz}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Setoran</CardTitle>
                <CardDescription>Seluruh riwayat setoran</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{detail.progress.totalSetoran}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Lancar</CardTitle>
                <CardDescription>Setoran bernilai lancar</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{detail.progress.lancar}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Progres Hafalan</CardTitle>
              <CardDescription>
                {detail.progress.juzTercapai} dari {detail.progress.targetJuz} juz (
                {detail.progress.persenJuz}%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={detail.progress.persenJuz} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grafik Perkembangan</CardTitle>
              <CardDescription>Akumulasi juz tercapai per tanggal</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.grafik.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada data grafik.</p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={detail.grafik}>
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
              {detail.targets.length === 0 ? (
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
                    {detail.targets.map((t) => (
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
              {detail.setoran.length === 0 ? (
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
                    {detail.setoran.map((s) => (
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
      ) : null}
    </div>
  );
}
