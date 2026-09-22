"use client";

import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { get, post, put, del, fmtDate, JENIS_LABEL, NILAI_LABEL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, Progress, Select, Tabs } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label, Textarea } from "@/components/ui/label";

// ---------- Tipe ----------
type UserRow = { id: number; nama: string; username: string; email: string; role: string };
type SantriRow = {
  id: number; user_id: number; nama: string; username: string; email: string;
  nis: string | null; kelas: string | null; target_juz: number;
  musyrif_id: number | null; musyrif_nama: string | null; tanggal_bergabung: string | null;
};
type SetoranRow = {
  id: number; santri_id: number; musyrif_id: number; juz: number; surah: string;
  ayat_awal: number; ayat_akhir: number; jenis: string; nilai: string;
  catatan: string | null; created_at: string; santri_nama: string; musyrif_nama: string;
};
type TargetRow = {
  id: number; santri_id: number; santri_nama: string; target_juz: number;
  periode: string | null; tanggal_mulai: string | null; tanggal_selesai: string | null; created_at: string;
};
type WaliLink = { id: number; wali_user_id: number; santri_id: number; relasi: string | null };
type StatsResp = {
  jumlahSantri: number; jumlahSetoran: number; jumlahMusyrif: number; jumlahWali: number;
  santri: SantriRow[]; setoran: SetoranRow[]; target: TargetRow[]; users: UserRow[];
};

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "santri", label: "Santri" },
  { value: "musyrif", label: "Musyrif" },
  { value: "wali", label: "Wali" },
  { value: "target", label: "Target" },
  { value: "users", label: "Users" },
  { value: "setoran", label: "Setoran" },
];

const JENIS_COLORS = ["#16a34a", "#2563eb", "#f59e0b"];
const NILAI_COLORS = ["#16a34a", "#2563eb", "#ef4444"];

const emptySantri = { nama: "", username: "", email: "", password: "", nis: "", kelas: "", target_juz: "30", musyrif_id: "", tanggal_bergabung: "" };
const emptyUser = { nama: "", username: "", email: "", password: "", role: "musyrif" };
const emptyWaliLink = { wali_user_id: "", santri_id: "", relasi: "Wali Santri" };
const emptyTarget = { santri_id: "", target_juz: "1", periode: "", tanggal_mulai: "", tanggal_selesai: "" };
const emptySetoran = { santri_id: "", musyrif_id: "", juz: "1", surah: "", ayat_awal: "0", ayat_akhir: "0", jenis: "hafalan_baru", nilai: "lancar", catatan: "" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<StatsResp | null>(null);
  const [waliLinks, setWaliLinks] = useState<WaliLink[]>([]);

  // dialog states
  const [santriOpen, setSantriOpen] = useState(false);
  const [santriEditId, setSantriEditId] = useState<number | null>(null);
  const [santriForm, setSantriForm] = useState(emptySantri);

  const [musyrifOpen, setMusyrifOpen] = useState(false);
  const [musyrifForm, setMusyrifForm] = useState({ nama: "", username: "", email: "", password: "" });

  const [waliOpen, setWaliOpen] = useState(false);
  const [waliForm, setWaliForm] = useState(emptyWaliLink);

  const [targetOpen, setTargetOpen] = useState(false);
  const [targetForm, setTargetForm] = useState(emptyTarget);

  const [userOpen, setUserOpen] = useState(false);
  const [userForm, setUserForm] = useState(emptyUser);

  const [setoranOpen, setSetoranOpen] = useState(false);
  const [setoranEditId, setSetoranEditId] = useState<number | null>(null);
  const [setoranForm, setSetoranForm] = useState(emptySetoran);

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const [s, w] = await Promise.all([
        get<StatsResp>("/api/admin/stats"),
        get<WaliLink[]>("/api/admin/wali-links"),
      ]);
      setStats(s);
      setWaliLinks(Array.isArray(w) ? w : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  const santri = useMemo(() => stats?.santri ?? [], [stats]);
  const setoran = useMemo(() => stats?.setoran ?? [], [stats]);
  const target = useMemo(() => stats?.target ?? [], [stats]);
  const users = useMemo(() => stats?.users ?? [], [stats]);
  const musyrifUsers = useMemo(() => users.filter((u) => u.role === "musyrif"), [users]);
  const waliUsers = useMemo(() => users.filter((u) => u.role === "wali"), [users]);

  // distribusi jenis & nilai untuk PieChart
  const jenisData = useMemo(() => {
    const keys = ["hafalan_baru", "tambahan", "murajaah"];
    return keys.map((k) => ({ name: JENIS_LABEL[k] ?? k, value: setoran.filter((s) => s.jenis === k).length }));
  }, [setoran]);
  const nilaiData = useMemo(() => {
    const keys = ["lancar", "cukup_lancar", "perlu_ulang"];
    return keys.map((k) => ({ name: NILAI_LABEL[k] ?? k, value: setoran.filter((s) => s.nilai === k).length }));
  }, [setoran]);

  // progres santri: distinct juz non-murajaah (inline)
  const progressRows = useMemo(() => {
    return santri.map((s) => {
      const juzSet = new Set(
        setoran.filter((x) => x.santri_id === s.id && x.jenis !== "murajaah").map((x) => Number(x.juz))
      );
      const tercapai = juzSet.size;
      const total = setoran.filter((x) => x.santri_id === s.id).length;
      return { ...s, tercapai, total };
    });
  }, [santri, setoran]);

  const santriName = (id: number) => santri.find((s) => s.id === Number(id))?.nama ?? `#${id}`;
  const userName = (id: number) => users.find((u) => u.id === Number(id))?.nama ?? `#${id}`;

  // ---------- Aksi Santri ----------
  async function submitSantri() {
    setError("");
    try {
      if (santriEditId == null) {
        await post("/api/admin/santri", {
          ...santriForm, target_juz: Number(santriForm.target_juz) || 30,
          musyrif_id: santriForm.musyrif_id ? Number(santriForm.musyrif_id) : null,
          tanggal_bergabung: santriForm.tanggal_bergabung || null,
        });
      } else {
        await put(`/api/admin/santri/${santriEditId}`, {
          nama: santriForm.nama, nis: santriForm.nis || null, kelas: santriForm.kelas || null,
          target_juz: Number(santriForm.target_juz) || 30,
          musyrif_id: santriForm.musyrif_id ? Number(santriForm.musyrif_id) : null,
          tanggal_bergabung: santriForm.tanggal_bergabung || null,
        });
      }
      setSantriOpen(false); setSantriEditId(null); setSantriForm(emptySantri);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal menyimpan santri"); }
  }
  function openSantriEdit(row: SantriRow) {
    setSantriEditId(row.id);
    setSantriForm({
      nama: row.nama, username: row.username, email: row.email, password: "",
      nis: row.nis ?? "", kelas: row.kelas ?? "", target_juz: String(row.target_juz ?? 30),
      musyrif_id: row.musyrif_id ? String(row.musyrif_id) : "",
      tanggal_bergabung: row.tanggal_bergabung ? String(row.tanggal_bergabung).slice(0, 10) : "",
    });
    setSantriOpen(true);
  }
  async function hapusSantri(row: SantriRow) {
    if (!confirm(`Hapus santri ${row.nama}?`)) return;
    try { await del(`/api/admin/users/${row.user_id}`); await reload(); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal menghapus santri"); }
  }

  // ---------- Aksi Musyrif / Users ----------
  async function submitMusyrif() {
    setError("");
    try {
      await post("/api/admin/users", { ...musyrifForm, role: "musyrif" });
      setMusyrifOpen(false); setMusyrifForm({ nama: "", username: "", email: "", password: "" });
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal menambah musyrif"); }
  }
  async function submitUser() {
    setError("");
    try {
      await post("/api/admin/users", userForm);
      setUserOpen(false); setUserForm(emptyUser);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal menambah user"); }
  }
  async function hapusUser(id: number) {
    if (!confirm("Hapus user ini?")) return;
    try { await del(`/api/admin/users/${id}`); await reload(); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal menghapus user"); }
  }

  // ---------- Aksi Wali ----------
  async function submitWaliLink() {
    setError("");
    try {
      await post("/api/admin/wali-link", {
        wali_user_id: Number(waliForm.wali_user_id),
        santri_id: Number(waliForm.santri_id),
        relasi: waliForm.relasi || "Wali Santri",
      });
      setWaliOpen(false); setWaliForm(emptyWaliLink);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal menambah relasi wali"); }
  }
  async function hapusWaliLink(id: number) {
    if (!confirm("Hapus relasi wali ini?")) return;
    try { await del(`/api/admin/wali-link/${id}`); await reload(); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal menghapus relasi"); }
  }

  // ---------- Aksi Target ----------
  async function submitTarget() {
    setError("");
    try {
      await post("/api/admin/target", {
        santri_id: Number(targetForm.santri_id),
        target_juz: Number(targetForm.target_juz),
        periode: targetForm.periode || null,
        tanggal_mulai: targetForm.tanggal_mulai || null,
        tanggal_selesai: targetForm.tanggal_selesai || null,
      });
      setTargetOpen(false); setTargetForm(emptyTarget);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal menyimpan target"); }
  }
  async function hapusTarget(id: number) {
    if (!confirm("Hapus target ini?")) return;
    try { await del(`/api/admin/target/${id}`); await reload(); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal menghapus target"); }
  }

  // ---------- Aksi Setoran ----------
  function openSetoranEdit(row: SetoranRow) {
    setSetoranEditId(row.id);
    setSetoranForm({
      santri_id: String(row.santri_id), musyrif_id: String(row.musyrif_id),
      juz: String(row.juz), surah: row.surah ?? "",
      ayat_awal: String(row.ayat_awal ?? 0), ayat_akhir: String(row.ayat_akhir ?? 0),
      jenis: row.jenis, nilai: row.nilai, catatan: row.catatan ?? "",
    });
    setSetoranOpen(true);
  }
  async function submitSetoran() {
    setError("");
    try {
      const payload = {
        santri_id: Number(setoranForm.santri_id), musyrif_id: Number(setoranForm.musyrif_id),
        juz: Number(setoranForm.juz), surah: setoranForm.surah,
        ayat_awal: Number(setoranForm.ayat_awal) || 0, ayat_akhir: Number(setoranForm.ayat_akhir) || 0,
        jenis: setoranForm.jenis, nilai: setoranForm.nilai, catatan: setoranForm.catatan || null,
      };
      if (setoranEditId == null) await post("/api/admin/setoran", payload);
      else await put(`/api/admin/setoran/${setoranEditId}`, payload);
      setSetoranOpen(false); setSetoranEditId(null); setSetoranForm(emptySetoran);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal menyimpan setoran"); }
  }
  async function hapusSetoran(id: number) {
    if (!confirm("Hapus setoran ini?")) return;
    try { await del(`/api/admin/setoran/${id}`); await reload(); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal menghapus setoran"); }
  }

  const sf = (k: keyof typeof santriForm) => ({
    value: santriForm[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSantriForm((f) => ({ ...f, [k]: e.target.value })),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground">Kelola santri, musyrif, wali, target, users, dan setoran.</p>
        </div>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
          {loading ? "Memuat..." : "Muat Ulang"}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {loading && !stats ? (
        <p className="text-sm text-muted-foreground">Memuat data...</p>
      ) : (
        <>
          {/* ===== OVERVIEW ===== */}
          {activeTab === "overview" && stats && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader><CardDescription>Total Santri</CardDescription><CardTitle>{stats.jumlahSantri}</CardTitle></CardHeader></Card>
                <Card><CardHeader><CardDescription>Total Setoran</CardDescription><CardTitle>{stats.jumlahSetoran}</CardTitle></CardHeader></Card>
                <Card><CardHeader><CardDescription>Total Musyrif</CardDescription><CardTitle>{stats.jumlahMusyrif}</CardTitle></CardHeader></Card>
                <Card><CardHeader><CardDescription>Total Wali</CardDescription><CardTitle>{stats.jumlahWali}</CardTitle></CardHeader></Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Distribusi Jenis Setoran</CardTitle><CardDescription>Hafalan baru, tambahan, murajaah</CardDescription></CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={jenisData} dataKey="value" nameKey="name" outerRadius={90} label>
                          {jenisData.map((_, i) => <Cell key={i} fill={JENIS_COLORS[i % JENIS_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Distribusi Nilai</CardTitle><CardDescription>Lancar, cukup lancar, perlu ulang</CardDescription></CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={nilaiData} dataKey="value" nameKey="name" outerRadius={90} label>
                          {nilaiData.map((_, i) => <Cell key={i} fill={NILAI_COLORS[i % NILAI_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Progres Santri</CardTitle><CardDescription>Juz tercapai (distinct juz non-murajaah) per santri</CardDescription></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Nama</TableHead><TableHead>Kelas</TableHead><TableHead>Juz Tercapai</TableHead><TableHead>Progres</TableHead><TableHead>Total Setoran</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {progressRows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.nama}</TableCell>
                          <TableCell>{r.kelas ?? "-"}</TableCell>
                          <TableCell>{r.tercapai} / {r.target_juz ?? 30}</TableCell>
                          <TableCell className="min-w-32"><Progress value={(r.tercapai / (r.target_juz || 30)) * 100} /></TableCell>
                          <TableCell>{r.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== SANTRI ===== */}
          {activeTab === "santri" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Data Santri</CardTitle><CardDescription>{santri.length} santri terdaftar</CardDescription></div>
                <Button size="sm" onClick={() => { setSantriEditId(null); setSantriForm(emptySantri); setSantriOpen(true); }}>Tambah</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Nama</TableHead><TableHead>NIS</TableHead><TableHead>Kelas</TableHead>
                    <TableHead>Target</TableHead><TableHead>Musyrif</TableHead><TableHead>Bergabung</TableHead><TableHead>Aksi</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {santri.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.nama}</TableCell>
                        <TableCell>{s.nis ?? "-"}</TableCell>
                        <TableCell>{s.kelas ?? "-"}</TableCell>
                        <TableCell>{s.target_juz} juz</TableCell>
                        <TableCell>{s.musyrif_nama ?? "-"}</TableCell>
                        <TableCell>{fmtDate(s.tanggal_bergabung)}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openSantriEdit(s)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => hapusSantri(s)}>Hapus</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* ===== MUSYRIF ===== */}
          {activeTab === "musyrif" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Data Musyrif</CardTitle><CardDescription>{musyrifUsers.length} musyrif</CardDescription></div>
                <Button size="sm" onClick={() => setMusyrifOpen(true)}>Tambah</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Nama</TableHead><TableHead>Username</TableHead><TableHead>Email</TableHead><TableHead>Aksi</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {musyrifUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.nama}</TableCell>
                        <TableCell>{u.username}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell><Button size="sm" variant="destructive" onClick={() => hapusUser(u.id)}>Hapus</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* ===== WALI ===== */}
          {activeTab === "wali" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Relasi Wali – Santri</CardTitle><CardDescription>{waliLinks.length} relasi</CardDescription></div>
                <Button size="sm" onClick={() => setWaliOpen(true)}>Tambah</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Wali</TableHead><TableHead>Santri</TableHead><TableHead>Relasi</TableHead><TableHead>Aksi</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {waliLinks.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{userName(w.wali_user_id)}</TableCell>
                        <TableCell>{santriName(w.santri_id)}</TableCell>
                        <TableCell><Badge variant="secondary">{w.relasi ?? "Wali Santri"}</Badge></TableCell>
                        <TableCell><Button size="sm" variant="destructive" onClick={() => hapusWaliLink(w.id)}>Hapus</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* ===== TARGET ===== */}
          {activeTab === "target" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Target Hafalan</CardTitle><CardDescription>{target.length} target</CardDescription></div>
                <Button size="sm" onClick={() => setTargetOpen(true)}>Tambah</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Santri</TableHead><TableHead>Target Juz</TableHead><TableHead>Periode</TableHead><TableHead>Tanggal</TableHead><TableHead>Aksi</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {target.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.santri_nama}</TableCell>
                        <TableCell>{t.target_juz} juz</TableCell>
                        <TableCell>{t.periode ?? "-"}</TableCell>
                        <TableCell>{fmtDate(t.tanggal_mulai)} – {fmtDate(t.tanggal_selesai)}</TableCell>
                        <TableCell><Button size="sm" variant="destructive" onClick={() => hapusTarget(t.id)}>Hapus</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* ===== USERS ===== */}
          {activeTab === "users" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Semua Users</CardTitle><CardDescription>{users.length} pengguna</CardDescription></div>
                <Button size="sm" onClick={() => setUserOpen(true)}>Tambah</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Nama</TableHead><TableHead>Username</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Aksi</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.nama}</TableCell>
                        <TableCell>{u.username}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell><Badge variant={u.role === "admin" ? "default" : u.role === "musyrif" ? "success" : "secondary"}>{u.role}</Badge></TableCell>
                        <TableCell><Button size="sm" variant="destructive" onClick={() => hapusUser(u.id)}>Hapus</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* ===== SETORAN ===== */}
          {activeTab === "setoran" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Data Setoran</CardTitle><CardDescription>{setoran.length} setoran</CardDescription></div>
                <Button size="sm" onClick={() => { setSetoranEditId(null); setSetoranForm(emptySetoran); setSetoranOpen(true); }}>Tambah</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Santri</TableHead><TableHead>Juz / Surah</TableHead><TableHead>Ayat</TableHead>
                    <TableHead>Jenis</TableHead><TableHead>Nilai</TableHead><TableHead>Tanggal</TableHead><TableHead>Aksi</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {setoran.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.santri_nama}</TableCell>
                        <TableCell>Juz {s.juz} – {s.surah}</TableCell>
                        <TableCell>{s.ayat_awal}–{s.ayat_akhir}</TableCell>
                        <TableCell><Badge variant="outline">{JENIS_LABEL[s.jenis] ?? s.jenis}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={s.nilai === "lancar" ? "success" : s.nilai === "cukup_lancar" ? "warning" : "destructive"}>
                            {NILAI_LABEL[s.nilai] ?? s.nilai}
                          </Badge>
                        </TableCell>
                        <TableCell>{fmtDate(s.created_at)}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openSetoranEdit(s)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => hapusSetoran(s.id)}>Hapus</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ===== Dialog Santri ===== */}
      <Dialog open={santriOpen} onOpenChange={setSantriOpen} title={santriEditId == null ? "Tambah Santri" : "Edit Santri"} description="Lengkapi data santri">
        <div className="grid gap-3">
          <Field label="Nama"><Input {...sf("nama")} placeholder="Nama lengkap" /></Field>
          {santriEditId == null && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Username"><Input {...sf("username")} /></Field>
                <Field label="Email"><Input type="email" {...sf("email")} /></Field>
              </div>
              <Field label="Password"><Input type="password" {...sf("password")} /></Field>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="NIS"><Input {...sf("nis")} /></Field>
            <Field label="Kelas"><Input {...sf("kelas")} placeholder="cth: 7A" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target Juz"><Input type="number" min={1} max={30} {...sf("target_juz")} /></Field>
            <Field label="Tanggal Bergabung"><Input type="date" {...sf("tanggal_bergabung")} /></Field>
          </div>
          <Field label="Musyrif">
            <Select value={santriForm.musyrif_id} onChange={(v) => setSantriForm((f) => ({ ...f, musyrif_id: v }))}
              placeholder="— Tanpa musyrif —"
              options={musyrifUsers.map((u) => ({ value: String(u.id), label: u.nama }))} />
          </Field>
          <Button onClick={submitSantri}>Simpan</Button>
        </div>
      </Dialog>

      {/* ===== Dialog Musyrif ===== */}
      <Dialog open={musyrifOpen} onOpenChange={setMusyrifOpen} title="Tambah Musyrif" description="Buat akun musyrif baru">
        <div className="grid gap-3">
          <Field label="Nama"><Input value={musyrifForm.nama} onChange={(e) => setMusyrifForm((f) => ({ ...f, nama: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Username"><Input value={musyrifForm.username} onChange={(e) => setMusyrifForm((f) => ({ ...f, username: e.target.value }))} /></Field>
            <Field label="Email"><Input type="email" value={musyrifForm.email} onChange={(e) => setMusyrifForm((f) => ({ ...f, email: e.target.value }))} /></Field>
          </div>
          <Field label="Password"><Input type="password" value={musyrifForm.password} onChange={(e) => setMusyrifForm((f) => ({ ...f, password: e.target.value }))} /></Field>
          <Button onClick={submitMusyrif}>Simpan</Button>
        </div>
      </Dialog>

      {/* ===== Dialog Wali ===== */}
      <Dialog open={waliOpen} onOpenChange={setWaliOpen} title="Tambah Relasi Wali" description="Hubungkan akun wali dengan santri">
        <div className="grid gap-3">
          <Field label="Wali">
            <Select value={waliForm.wali_user_id} onChange={(v) => setWaliForm((f) => ({ ...f, wali_user_id: v }))}
              placeholder="Pilih wali" options={waliUsers.map((u) => ({ value: String(u.id), label: u.nama }))} />
          </Field>
          <Field label="Santri">
            <Select value={waliForm.santri_id} onChange={(v) => setWaliForm((f) => ({ ...f, santri_id: v }))}
              placeholder="Pilih santri" options={santri.map((s) => ({ value: String(s.id), label: s.nama }))} />
          </Field>
          <Field label="Relasi"><Input value={waliForm.relasi} onChange={(e) => setWaliForm((f) => ({ ...f, relasi: e.target.value }))} /></Field>
          <Button onClick={submitWaliLink}>Simpan</Button>
        </div>
      </Dialog>

      {/* ===== Dialog Target ===== */}
      <Dialog open={targetOpen} onOpenChange={setTargetOpen} title="Tambah Target" description="Tetapkan target hafalan santri">
        <div className="grid gap-3">
          <Field label="Santri">
            <Select value={targetForm.santri_id} onChange={(v) => setTargetForm((f) => ({ ...f, santri_id: v }))}
              placeholder="Pilih santri" options={santri.map((s) => ({ value: String(s.id), label: s.nama }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target Juz"><Input type="number" min={1} max={30} value={targetForm.target_juz} onChange={(e) => setTargetForm((f) => ({ ...f, target_juz: e.target.value }))} /></Field>
            <Field label="Periode"><Input value={targetForm.periode} onChange={(e) => setTargetForm((f) => ({ ...f, periode: e.target.value }))} placeholder="cth: Semester 1" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal Mulai"><Input type="date" value={targetForm.tanggal_mulai} onChange={(e) => setTargetForm((f) => ({ ...f, tanggal_mulai: e.target.value }))} /></Field>
            <Field label="Tanggal Selesai"><Input type="date" value={targetForm.tanggal_selesai} onChange={(e) => setTargetForm((f) => ({ ...f, tanggal_selesai: e.target.value }))} /></Field>
          </div>
          <Button onClick={submitTarget}>Simpan</Button>
        </div>
      </Dialog>

      {/* ===== Dialog User ===== */}
      <Dialog open={userOpen} onOpenChange={setUserOpen} title="Tambah User" description="Buat pengguna dengan role apapun">
        <div className="grid gap-3">
          <Field label="Nama"><Input value={userForm.nama} onChange={(e) => setUserForm((f) => ({ ...f, nama: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Username"><Input value={userForm.username} onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))} /></Field>
            <Field label="Email"><Input type="email" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Password"><Input type="password" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} /></Field>
            <Field label="Role">
              <Select value={userForm.role} onChange={(v) => setUserForm((f) => ({ ...f, role: v }))}
                options={["admin", "musyrif", "santri", "wali"].map((r) => ({ value: r, label: r }))} />
            </Field>
          </div>
          <Button onClick={submitUser}>Simpan</Button>
        </div>
      </Dialog>

      {/* ===== Dialog Setoran ===== */}
      <Dialog open={setoranOpen} onOpenChange={setSetoranOpen} title={setoranEditId == null ? "Tambah Setoran" : "Edit Setoran"} description="Catat / perbarui setoran hafalan">
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Santri">
              <Select value={setoranForm.santri_id} onChange={(v) => setSetoranForm((f) => ({ ...f, santri_id: v }))}
                placeholder="Pilih santri" options={santri.map((s) => ({ value: String(s.id), label: s.nama }))} />
            </Field>
            <Field label="Musyrif">
              <Select value={setoranForm.musyrif_id} onChange={(v) => setSetoranForm((f) => ({ ...f, musyrif_id: v }))}
                placeholder="Pilih musyrif" options={musyrifUsers.map((u) => ({ value: String(u.id), label: u.nama }))} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Juz"><Input type="number" min={1} max={30} value={setoranForm.juz} onChange={(e) => setSetoranForm((f) => ({ ...f, juz: e.target.value }))} /></Field>
            <Field label="Surah"><Input value={setoranForm.surah} onChange={(e) => setSetoranForm((f) => ({ ...f, surah: e.target.value }))} /></Field>
            <Field label="Jenis">
              <Select value={setoranForm.jenis} onChange={(v) => setSetoranForm((f) => ({ ...f, jenis: v }))}
                options={Object.entries(JENIS_LABEL).map(([value, label]) => ({ value, label }))} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Ayat Awal"><Input type="number" value={setoranForm.ayat_awal} onChange={(e) => setSetoranForm((f) => ({ ...f, ayat_awal: e.target.value }))} /></Field>
            <Field label="Ayat Akhir"><Input type="number" value={setoranForm.ayat_akhir} onChange={(e) => setSetoranForm((f) => ({ ...f, ayat_akhir: e.target.value }))} /></Field>
            <Field label="Nilai">
              <Select value={setoranForm.nilai} onChange={(v) => setSetoranForm((f) => ({ ...f, nilai: v }))}
                options={Object.entries(NILAI_LABEL).map(([value, label]) => ({ value, label }))} />
            </Field>
          </div>
          <Field label="Catatan"><Textarea value={setoranForm.catatan} onChange={(e) => setSetoranForm((f) => ({ ...f, catatan: e.target.value }))} /></Field>
          <Button onClick={submitSetoran}>Simpan</Button>
        </div>
      </Dialog>
    </div>
  );
}
