"use client";

import { useEffect, useState } from "react";
import { get, post, del, fmtDate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";

type Target = {
  id: number;
  santri_id: number;
  target_juz: number;
  periode: string | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  created_at: string;
  santri_nama: string;
  kelas: string | null;
};

type Binaan = {
  santri_id: number;
  nama: string;
  kelas: string | null;
  nis: string | null;
};

export default function TargetHafalanPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [santri, setSantri] = useState<Binaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    santri_id: "",
    target_juz: "30",
    periode: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
  });
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [t, s] = await Promise.all([
        get<Target[]>("/api/musyrif/targets"),
        get<Binaan[]>("/api/musyrif/santri"),
      ]);
      setTargets(t);
      setSantri(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat target hafalan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  function bukaDialog() {
    setForm({
      santri_id: "",
      target_juz: "30",
      periode: "",
      tanggal_mulai: "",
      tanggal_selesai: "",
    });
    setFormMsg(null);
    setDialogOpen(true);
  }

  async function simpanTarget() {
    if (!form.santri_id) {
      setFormMsg("Pilih santri terlebih dahulu.");
      return;
    }
    setSaving(true);
    setFormMsg(null);
    try {
      await post("/api/musyrif/target", {
        santri_id: Number(form.santri_id),
        target_juz: Number(form.target_juz),
        periode: form.periode || null,
        tanggal_mulai: form.tanggal_mulai || null,
        tanggal_selesai: form.tanggal_selesai || null,
      });
      setDialogOpen(false);
      await load();
    } catch (e) {
      setFormMsg(e instanceof Error ? e.message : "Gagal menyimpan target");
    } finally {
      setSaving(false);
    }
  }

  async function hapusTarget(id: number) {
    if (!window.confirm("Hapus target hafalan ini?")) return;
    try {
      await del(`/api/musyrif/target/${id}`);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus target");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Target Hafalan</h1>
        <p className="text-sm text-muted-foreground">Memuat target hafalan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Target Hafalan</h1>
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
          <h1 className="text-2xl font-bold">Target Hafalan</h1>
          <p className="text-sm text-muted-foreground">
            {targets.length} target untuk santri binaan Anda.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            Muat Ulang
          </Button>
          <Button size="sm" onClick={bukaDialog}>
            Tambah Target
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Target</CardTitle>
          <CardDescription>Target terbaru ke terlama</CardDescription>
        </CardHeader>
        <CardContent>
          {targets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada target hafalan.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Santri</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Target Juz</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Mulai</TableHead>
                  <TableHead>Selesai</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.santri_nama}</TableCell>
                    <TableCell>{t.kelas ?? "-"}</TableCell>
                    <TableCell>{t.target_juz} Juz</TableCell>
                    <TableCell>{t.periode ?? "-"}</TableCell>
                    <TableCell>{fmtDate(t.tanggal_mulai)}</TableCell>
                    <TableCell>{fmtDate(t.tanggal_selesai)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => hapusTarget(t.id)}
                      >
                        Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Tambah Target Hafalan"
        description="Tetapkan target juz baru untuk santri binaan."
      >
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label>Santri</Label>
            <Select
              value={form.santri_id}
              onChange={(v) => setForm({ ...form, santri_id: v })}
              placeholder="-- Pilih santri --"
              options={santri.map((s) => ({
                value: String(s.santri_id),
                label: `${s.nama}${s.kelas ? ` • ${s.kelas}` : ""}`,
              }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Target Juz</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={form.target_juz}
                onChange={(e) => setForm({ ...form, target_juz: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Periode</Label>
              <Input
                value={form.periode}
                onChange={(e) => setForm({ ...form, periode: e.target.value })}
                placeholder="cth. Semester Ganjil"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={form.tanggal_mulai}
                onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Tanggal Selesai</Label>
              <Input
                type="date"
                value={form.tanggal_selesai}
                onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })}
              />
            </div>
          </div>
          <Button size="sm" disabled={saving} onClick={simpanTarget}>
            {saving ? "Menyimpan..." : "Simpan Target"}
          </Button>
          {formMsg && <p className="text-sm text-destructive">{formMsg}</p>}
        </div>
      </Dialog>
    </div>
  );
}
