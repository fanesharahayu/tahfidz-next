"use client";

import { useEffect, useState } from "react";
import { get, post, put, del, fmtDate, JENIS_LABEL, NILAI_LABEL } from "@/lib/api";
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
import { Dialog, Progress, Select } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label, Textarea } from "@/components/ui/label";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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

type Unassigned = {
  santri_id: number;
  nis: string | null;
  kelas: string | null;
  user_id: number;
  nama: string;
  email: string;
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
  catatan: string | null;
};

type Target = {
  id: number;
  target_juz: number;
  periode: string | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
};

type Detail = {
  santri: Record<string, unknown> & {
    nama?: string;
    nis?: string;
    kelas?: string;
    target_juz?: number;
  };
  setoran: Setoran[];
  targets: Target[];
  progress: ProgressData;
  grafik: { tanggal: string; juz: number }[];
};

const JENIS_OPTIONS = [
  { value: "hafalan_baru", label: "Hafalan Baru" },
  { value: "tambahan", label: "Tambahan" },
  { value: "murajaah", label: "Murajaah" },
];

const NILAI_OPTIONS = [
  { value: "lancar", label: "Lancar" },
  { value: "cukup_lancar", label: "Cukup Lancar" },
  { value: "perlu_ulang", label: "Perlu Ulang" },
];

const emptySetoranForm = {
  juz: "",
  surah: "",
  ayat_awal: "",
  ayat_akhir: "",
  jenis: "hafalan_baru",
  nilai: "lancar",
  catatan: "",
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

export default function SantriBinaanPage() {
  const [list, setList] = useState<Binaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [unassigned, setUnassigned] = useState<Unassigned[]>([]);
  const [tambahOpen, setTambahOpen] = useState(false);
  const [tambahMode, setTambahMode] = useState<"pilih" | "baru">("pilih");
  const [pilihId, setPilihId] = useState("");
  const [baruForm, setBaruForm] = useState({
    nama: "",
    username: "",
    email: "",
    password: "",
    nis: "",
    kelas: "",
    target_juz: "30",
  });
  const [tambahMsg, setTambahMsg] = useState<string | null>(null);
  const [savingTambah, setSavingTambah] = useState(false);

  const [setoranOpen, setSetoranOpen] = useState(false);
  const [setoranSantri, setSetoranSantri] = useState<Binaan | null>(null);
  const [setoranForm, setSetoranForm] = useState(emptySetoranForm);
  const [setoranMsg, setSetoranMsg] = useState<string | null>(null);
  const [savingSetoran, setSavingSetoran] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptySetoranForm);
  const [editMsg, setEditMsg] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await get<Binaan[]>("/api/musyrif/santri");
      setList(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat santri binaan");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: number) {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const res = await get<Detail>(`/api/musyrif/santri/${id}`);
      setDetail(res);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Gagal memuat detail santri");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function loadUnassigned() {
    try {
      const res = await get<Unassigned[]>("/api/musyrif/santri/unassigned");
      setUnassigned(res);
    } catch {
      setUnassigned([]);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  function pilihSantri(id: number) {
    setSelectedId(id);
    loadDetail(id);
  }

  function bukaTambah() {
    setTambahMsg(null);
    setPilihId("");
    setTambahOpen(true);
    loadUnassigned();
  }

  async function simpanAmbilBinaan() {
    if (!pilihId) {
      setTambahMsg("Pilih santri terlebih dahulu.");
      return;
    }
    setSavingTambah(true);
    setTambahMsg(null);
    try {
      const res = await post<{ message: string }>(
        `/api/musyrif/santri/${pilihId}/assign`,
        {}
      );
      setTambahMsg(res.message);
      await load();
      setTambahOpen(false);
    } catch (e) {
      setTambahMsg(e instanceof Error ? e.message : "Gagal mengambil santri binaan");
    } finally {
      setSavingTambah(false);
    }
  }

  async function simpanSantriBaru() {
    setSavingTambah(true);
    setTambahMsg(null);
    try {
      const res = await post<{ message: string }>("/api/musyrif/santri", {
        ...baruForm,
        target_juz: Number(baruForm.target_juz) || 30,
      });
      setTambahMsg(res.message);
      setBaruForm({
        nama: "",
        username: "",
        email: "",
        password: "",
        nis: "",
        kelas: "",
        target_juz: "30",
      });
      await load();
      setTambahOpen(false);
    } catch (e) {
      setTambahMsg(e instanceof Error ? e.message : "Gagal menambah santri");
    } finally {
      setSavingTambah(false);
    }
  }

  function bukaCatatSetoran(s: Binaan) {
    setSetoranSantri(s);
    setSetoranForm(emptySetoranForm);
    setSetoranMsg(null);
    setSetoranOpen(true);
  }

  async function simpanSetoran() {
    if (!setoranSantri) return;
    setSavingSetoran(true);
    setSetoranMsg(null);
    try {
      await post(`/api/musyrif/santri/${setoranSantri.santri_id}/setoran`, {
        juz: Number(setoranForm.juz),
        surah: setoranForm.surah,
        ayat_awal: Number(setoranForm.ayat_awal) || 0,
        ayat_akhir: Number(setoranForm.ayat_akhir) || 0,
        jenis: setoranForm.jenis,
        nilai: setoranForm.nilai,
        catatan: setoranForm.catatan || null,
      });
      setSetoranOpen(false);
      await load();
      if (selectedId === setoranSantri.santri_id) await loadDetail(setoranSantri.santri_id);
    } catch (e) {
      setSetoranMsg(e instanceof Error ? e.message : "Gagal mencatat setoran");
    } finally {
      setSavingSetoran(false);
    }
  }

  function bukaEdit(s: Setoran) {
    setEditId(s.id);
    setEditForm({
      juz: String(s.juz),
      surah: s.surah ?? "",
      ayat_awal: s.ayat_awal ? String(s.ayat_awal) : "",
      ayat_akhir: s.ayat_akhir ? String(s.ayat_akhir) : "",
      jenis: s.jenis,
      nilai: s.nilai,
      catatan: s.catatan ?? "",
    });
    setEditMsg(null);
    setEditOpen(true);
  }

  async function simpanEdit() {
    if (editId === null) return;
    setSavingEdit(true);
    setEditMsg(null);
    try {
      await put(`/api/musyrif/setoran/${editId}`, {
        juz: Number(editForm.juz),
        surah: editForm.surah,
        ayat_awal: Number(editForm.ayat_awal) || 0,
        ayat_akhir: Number(editForm.ayat_akhir) || 0,
        jenis: editForm.jenis,
        nilai: editForm.nilai,
        catatan: editForm.catatan || null,
      });
      setEditOpen(false);
      await load();
      if (selectedId !== null) await loadDetail(selectedId);
    } catch (e) {
      setEditMsg(e instanceof Error ? e.message : "Gagal memperbarui setoran");
    } finally {
      setSavingEdit(false);
    }
  }

  async function hapusSetoran(id: number) {
    if (!window.confirm("Hapus setoran ini?")) return;
    try {
      await del(`/api/musyrif/setoran/${id}`);
      await load();
      if (selectedId !== null) await loadDetail(selectedId);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus setoran");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Santri Binaan</h1>
        <p className="text-sm text-muted-foreground">Memuat data santri binaan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Santri Binaan</h1>
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
          <h1 className="text-2xl font-bold">Santri Binaan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola santri binaan, catat setoran, dan pantau progres.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            Muat Ulang
          </Button>
          <Button size="sm" onClick={bukaTambah}>
            Tambah Santri
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Belum ada santri binaan</CardTitle>
            <CardDescription>
              Tambahkan santri baru atau pilih dari santri yang belum memiliki musyrif.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <Card
              key={s.santri_id}
              className={
                s.santri_id === selectedId
                  ? "border-primary ring-1 ring-primary"
                  : "hover:border-primary/60"
              }
            >
              <CardHeader>
                <CardTitle>{s.nama}</CardTitle>
                <CardDescription>
                  {s.nis ? `NIS ${s.nis}` : "NIS -"}
                  {s.kelas ? ` • Kelas ${s.kelas}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {s.progress.juzTercapai}/{s.progress.targetJuz} Juz
                  </span>
                  <span className="text-muted-foreground">
                    {s.progress.persenJuz}% • {s.setoranCount} setoran
                  </span>
                </div>
                <Progress value={s.progress.persenJuz} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => pilihSantri(s.santri_id)}>
                    Detail
                  </Button>
                  <Button size="sm" onClick={() => bukaCatatSetoran(s)}>
                    Catat Setoran
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedId !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Detail Santri</CardTitle>
            <CardDescription>
              Grafik perkembangan, target, dan riwayat setoran
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDetail ? (
              <p className="text-sm text-muted-foreground">Memuat detail...</p>
            ) : detailError ? (
              <div className="space-y-2">
                <p className="text-sm text-destructive">{detailError}</p>
                <Button size="sm" onClick={() => loadDetail(selectedId)}>
                  Coba Lagi
                </Button>
              </div>
            ) : detail ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold">
                    {String(detail.santri.nama ?? "-")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {detail.santri.nis ? `NIS ${String(detail.santri.nis)}` : "NIS -"}
                    {detail.santri.kelas ? ` • Kelas ${String(detail.santri.kelas)}` : ""}
                    {` • ${detail.progress.juzTercapai}/${detail.progress.targetJuz} Juz (${detail.progress.persenJuz}%)`}
                  </p>
                  <div className="mt-2">
                    <Progress value={detail.progress.persenJuz} />
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-medium">Grafik Perkembangan</h3>
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
                </div>

                <div>
                  <h3 className="mb-2 font-medium">Target Hafalan</h3>
                  {detail.targets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada target.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Target Juz</TableHead>
                          <TableHead>Periode</TableHead>
                          <TableHead>Mulai</TableHead>
                          <TableHead>Selesai</TableHead>
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
                </div>

                <div>
                  <h3 className="mb-2 font-medium">Riwayat Setoran</h3>
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
                          <TableHead>Aksi</TableHead>
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
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => bukaEdit(s)}>
                                  Ubah
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => hapusSetoran(s.id)}
                                >
                                  Hapus
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={tambahOpen}
        onOpenChange={setTambahOpen}
        title="Tambah Santri Binaan"
        description="Pilih santri yang belum memiliki musyrif atau buat akun santri baru."
      >
        <div className="mb-3 flex gap-2">
          <Button
            size="sm"
            variant={tambahMode === "pilih" ? "default" : "outline"}
            onClick={() => setTambahMode("pilih")}
          >
            Pilih yang Ada
          </Button>
          <Button
            size="sm"
            variant={tambahMode === "baru" ? "default" : "outline"}
            onClick={() => setTambahMode("baru")}
          >
            Buat Baru
          </Button>
        </div>
        {tambahMode === "pilih" ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Santri tanpa musyrif</Label>
              <Select
                value={pilihId}
                onChange={setPilihId}
                placeholder="-- Pilih santri --"
                options={unassigned.map((u) => ({
                  value: String(u.santri_id),
                  label: `${u.nama}${u.kelas ? ` • ${u.kelas}` : ""}`,
                }))}
              />
            </div>
            <Button size="sm" disabled={savingTambah} onClick={simpanAmbilBinaan}>
              {savingTambah ? "Menyimpan..." : "Jadikan Binaan"}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nama</Label>
                <Input
                  value={baruForm.nama}
                  onChange={(e) => setBaruForm({ ...baruForm, nama: e.target.value })}
                  placeholder="Nama santri"
                />
              </div>
              <div className="space-y-1">
                <Label>Username</Label>
                <Input
                  value={baruForm.username}
                  onChange={(e) => setBaruForm({ ...baruForm, username: e.target.value })}
                  placeholder="username"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={baruForm.email}
                  onChange={(e) => setBaruForm({ ...baruForm, email: e.target.value })}
                  placeholder="email"
                />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={baruForm.password}
                  onChange={(e) => setBaruForm({ ...baruForm, password: e.target.value })}
                  placeholder="min. 6 karakter"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>NIS</Label>
                <Input
                  value={baruForm.nis}
                  onChange={(e) => setBaruForm({ ...baruForm, nis: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Kelas</Label>
                <Input
                  value={baruForm.kelas}
                  onChange={(e) => setBaruForm({ ...baruForm, kelas: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Target Juz</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={baruForm.target_juz}
                  onChange={(e) => setBaruForm({ ...baruForm, target_juz: e.target.value })}
                />
              </div>
            </div>
            <Button size="sm" disabled={savingTambah} onClick={simpanSantriBaru}>
              {savingTambah ? "Menyimpan..." : "Simpan Santri"}
            </Button>
          </div>
        )}
        {tambahMsg && <p className="mt-2 text-sm text-muted-foreground">{tambahMsg}</p>}
      </Dialog>

      <Dialog
        open={setoranOpen}
        onOpenChange={setSetoranOpen}
        title={`Catat Setoran — ${setoranSantri?.nama ?? ""}`}
        description="Isi detail hafalan yang disetorkan santri."
      >
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Juz</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={setoranForm.juz}
                onChange={(e) => setSetoranForm({ ...setoranForm, juz: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Surah</Label>
              <Input
                value={setoranForm.surah}
                onChange={(e) => setSetoranForm({ ...setoranForm, surah: e.target.value })}
                placeholder="cth. Al-Baqarah"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Ayat Awal</Label>
              <Input
                type="number"
                value={setoranForm.ayat_awal}
                onChange={(e) => setSetoranForm({ ...setoranForm, ayat_awal: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Ayat Akhir</Label>
              <Input
                type="number"
                value={setoranForm.ayat_akhir}
                onChange={(e) => setSetoranForm({ ...setoranForm, ayat_akhir: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Jenis</Label>
              <Select
                value={setoranForm.jenis}
                onChange={(v) => setSetoranForm({ ...setoranForm, jenis: v })}
                options={JENIS_OPTIONS}
              />
            </div>
            <div className="space-y-1">
              <Label>Nilai</Label>
              <Select
                value={setoranForm.nilai}
                onChange={(v) => setSetoranForm({ ...setoranForm, nilai: v })}
                options={NILAI_OPTIONS}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Catatan</Label>
            <Textarea
              value={setoranForm.catatan}
              onChange={(e) => setSetoranForm({ ...setoranForm, catatan: e.target.value })}
              placeholder="Catatan musyrif (opsional)"
            />
          </div>
          <Button size="sm" disabled={savingSetoran} onClick={simpanSetoran}>
            {savingSetoran ? "Menyimpan..." : "Simpan Setoran"}
          </Button>
          {setoranMsg && <p className="text-sm text-destructive">{setoranMsg}</p>}
        </div>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Ubah Setoran"
        description="Perbarui detail setoran santri."
      >
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Juz</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={editForm.juz}
                onChange={(e) => setEditForm({ ...editForm, juz: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Surah</Label>
              <Input
                value={editForm.surah}
                onChange={(e) => setEditForm({ ...editForm, surah: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Ayat Awal</Label>
              <Input
                type="number"
                value={editForm.ayat_awal}
                onChange={(e) => setEditForm({ ...editForm, ayat_awal: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Ayat Akhir</Label>
              <Input
                type="number"
                value={editForm.ayat_akhir}
                onChange={(e) => setEditForm({ ...editForm, ayat_akhir: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Jenis</Label>
              <Select
                value={editForm.jenis}
                onChange={(v) => setEditForm({ ...editForm, jenis: v })}
                options={JENIS_OPTIONS}
              />
            </div>
            <div className="space-y-1">
              <Label>Nilai</Label>
              <Select
                value={editForm.nilai}
                onChange={(v) => setEditForm({ ...editForm, nilai: v })}
                options={NILAI_OPTIONS}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Catatan</Label>
            <Textarea
              value={editForm.catatan}
              onChange={(e) => setEditForm({ ...editForm, catatan: e.target.value })}
            />
          </div>
          <Button size="sm" disabled={savingEdit} onClick={simpanEdit}>
            {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
          {editMsg && <p className="text-sm text-destructive">{editMsg}</p>}
        </div>
      </Dialog>
    </div>
  );
}
