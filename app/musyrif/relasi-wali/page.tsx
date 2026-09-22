"use client";

import { useEffect, useState } from "react";
import { get, post, del } from "@/lib/api";
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

type WaliLink = {
  id: number;
  wali_user_id: number;
  santri_id: number;
  relasi: string | null;
  wali_nama: string;
  santri_nama: string;
  kelas: string | null;
};

type Wali = {
  id: number;
  nama: string;
  username: string;
  email: string;
};

type Binaan = {
  santri_id: number;
  nama: string;
  kelas: string | null;
  nis: string | null;
};

export default function RelasiWaliPage() {
  const [links, setLinks] = useState<WaliLink[]>([]);
  const [walis, setWalis] = useState<Wali[]>([]);
  const [santri, setSantri] = useState<Binaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ wali_user_id: "", santri_id: "", relasi: "Wali Santri" });
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [l, w, s] = await Promise.all([
        get<WaliLink[]>("/api/musyrif/wali-links"),
        get<Wali[]>("/api/musyrif/walis"),
        get<Binaan[]>("/api/musyrif/santri"),
      ]);
      setLinks(l);
      setWalis(w);
      setSantri(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat relasi wali");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  function bukaDialog() {
    setForm({ wali_user_id: "", santri_id: "", relasi: "Wali Santri" });
    setFormMsg(null);
    setDialogOpen(true);
  }

  async function simpanRelasi() {
    if (!form.wali_user_id || !form.santri_id) {
      setFormMsg("Wali dan santri wajib dipilih.");
      return;
    }
    setSaving(true);
    setFormMsg(null);
    try {
      await post("/api/musyrif/wali-link", {
        wali_user_id: Number(form.wali_user_id),
        santri_id: Number(form.santri_id),
        relasi: form.relasi || "Wali Santri",
      });
      setDialogOpen(false);
      await load();
    } catch (e) {
      setFormMsg(e instanceof Error ? e.message : "Gagal menyimpan relasi");
    } finally {
      setSaving(false);
    }
  }

  async function hapusRelasi(id: number) {
    if (!window.confirm("Hapus hubungan wali-santri ini?")) return;
    try {
      await del(`/api/musyrif/wali-link/${id}`);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus relasi");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Relasi Wali</h1>
        <p className="text-sm text-muted-foreground">Memuat relasi wali-santri...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Relasi Wali</h1>
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
          <h1 className="text-2xl font-bold">Relasi Wali</h1>
          <p className="text-sm text-muted-foreground">
            {links.length} hubungan wali-santri pada binaan Anda.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            Muat Ulang
          </Button>
          <Button size="sm" onClick={bukaDialog}>
            Tambah Relasi
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Relasi</CardTitle>
          <CardDescription>Akun wali yang terhubung dengan santri binaan</CardDescription>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada relasi wali-santri. Tambahkan relasi baru agar wali dapat
              memantau santri.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wali</TableHead>
                  <TableHead>Santri</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Relasi</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.wali_nama}</TableCell>
                    <TableCell>{l.santri_nama}</TableCell>
                    <TableCell>{l.kelas ?? "-"}</TableCell>
                    <TableCell>{l.relasi ?? "-"}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => hapusRelasi(l.id)}
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
        title="Tambah Relasi Wali"
        description="Hubungkan akun wali dengan santri binaan."
      >
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label>Wali</Label>
            <Select
              value={form.wali_user_id}
              onChange={(v) => setForm({ ...form, wali_user_id: v })}
              placeholder="-- Pilih wali --"
              options={walis.map((w) => ({
                value: String(w.id),
                label: `${w.nama} (${w.username})`,
              }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Santri Binaan</Label>
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
          <div className="space-y-1">
            <Label>Relasi</Label>
            <Input
              value={form.relasi}
              onChange={(e) => setForm({ ...form, relasi: e.target.value })}
              placeholder="cth. Ayah / Ibu / Wali Santri"
            />
          </div>
          <Button size="sm" disabled={saving} onClick={simpanRelasi}>
            {saving ? "Menyimpan..." : "Simpan Relasi"}
          </Button>
          {formMsg && <p className="text-sm text-destructive">{formMsg}</p>}
        </div>
      </Dialog>
    </div>
  );
}
