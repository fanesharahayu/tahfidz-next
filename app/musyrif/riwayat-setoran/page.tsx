"use client";

import { useEffect, useMemo, useState } from "react";
import { get, put, del, fmtDate, JENIS_LABEL, NILAI_LABEL } from "@/lib/api";
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
import { Dialog, Select } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label, Textarea } from "@/components/ui/label";

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

export default function RiwayatSetoranPage() {
  const [list, setList] = useState<Setoran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    juz: "",
    surah: "",
    ayat_awal: "",
    ayat_akhir: "",
    jenis: "hafalan_baru",
    nilai: "lancar",
    catatan: "",
  });
  const [editMsg, setEditMsg] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await get<Setoran[]>("/api/musyrif/setoran");
      setList(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat riwayat setoran");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        (s.santri_nama ?? "").toLowerCase().includes(q) ||
        (s.surah ?? "").toLowerCase().includes(q) ||
        (s.kelas ?? "").toLowerCase().includes(q)
    );
  }, [list, search]);

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
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus setoran");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Riwayat Setoran</h1>
        <p className="text-sm text-muted-foreground">Memuat riwayat setoran...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Riwayat Setoran</h1>
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
          <h1 className="text-2xl font-bold">Riwayat Setoran</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} setoran dari santri binaan Anda.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          Muat Ulang
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cari Setoran</CardTitle>
          <CardDescription>
            Cari berdasarkan nama santri, surah, atau kelas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="cth. Ahmad / Al-Baqarah / 7A"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Setoran</CardTitle>
          <CardDescription>
            {filtered.length} dari {list.length} setoran ditampilkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {list.length === 0 ? "Belum ada setoran." : "Tidak ada hasil pencarian."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Santri</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Juz</TableHead>
                  <TableHead>Surah</TableHead>
                  <TableHead>Ayat</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{fmtDate(s.created_at)}</TableCell>
                    <TableCell>{s.santri_nama}</TableCell>
                    <TableCell>{s.kelas ?? "-"}</TableCell>
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
        </CardContent>
      </Card>

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
