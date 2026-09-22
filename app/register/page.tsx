"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/dialog";

interface SantriOption {
  santri_id: number;
  nama: string;
  nis: string | null;
  kelas: string | null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [nama, setNama] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("santri");
  const [nis, setNis] = React.useState("");
  const [kelas, setKelas] = React.useState("");
  const [spesialisasi, setSpesialisasi] = React.useState("");
  const [santriId, setSantriId] = React.useState("");
  const [relasi, setRelasi] = React.useState("");
  const [santriList, setSantriList] = React.useState<SantriOption[]>([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (role !== "wali") return;
    get<SantriOption[]>("/api/auth/santri")
      .then((data) => setSantriList(Array.isArray(data) ? data : []))
      .catch(() => setSantriList([]));
  }, [role]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nama || !username || !email || !password) {
      setError("Nama, username, email, dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      await post("/api/auth/register", {
        nama,
        username,
        email,
        password,
        role,
        nis: role === "santri" ? nis : undefined,
        kelas: role === "santri" ? kelas : undefined,
        spesialisasi: role === "musyrif" ? spesialisasi : undefined,
        santri_id: role === "wali" && santriId ? Number(santriId) : undefined,
        relasi: role === "wali" ? relasi : undefined,
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#115e59_0%,#0f766e_50%,#134e4a_100%)] p-5 py-10">
      <div className="w-full max-w-[420px] rounded-[18px] bg-white px-9 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f766e,#14b8a6)] text-3xl text-white">
            📖
          </div>
          <h1 className="text-[22px] font-semibold text-[#115e59]">Buat Akun Baru</h1>
          <p className="mt-1 text-[13px] text-[#64748b]">Pendaftaran untuk Musyrif, Santri &amp; Wali Santri</p>
        </div>
        {error ? (
          <div className="mb-4 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] text-[#dc2626]" role="alert">
            {error}
          </div>
        ) : null}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="role" className="mb-1.5 block text-[13px] font-semibold text-[#1e293b]">Daftar sebagai</Label>
            <Select
              value={role}
              onChange={setRole}
              options={[
                { value: "musyrif", label: "Musyrif (Pengajar)" },
                { value: "santri", label: "Santri (Hafiz)" },
                { value: "wali", label: "Wali Santri" },
              ]}
              className="h-[44px] rounded-[10px] border-[#e2e8f0] text-sm"
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="nama" className="mb-1.5 block text-[13px] font-semibold text-[#1e293b]">Nama Lengkap</Label>
            <Input
              id="nama"
              type="text"
              placeholder="Nama lengkap"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="h-[44px] rounded-[10px] border-[#e2e8f0] text-sm focus-visible:ring-[#14b8a6]"
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="username" className="mb-1.5 block text-[13px] font-semibold text-[#1e293b]">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="h-[44px] rounded-[10px] border-[#e2e8f0] text-sm focus-visible:ring-[#14b8a6]"
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-[#1e293b]">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@contoh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-[44px] rounded-[10px] border-[#e2e8f0] text-sm focus-visible:ring-[#14b8a6]"
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-[#1e293b]">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-[44px] rounded-[10px] border-[#e2e8f0] text-sm focus-visible:ring-[#14b8a6]"
            />
          </div>

          {role === "santri" ? (
            <>
              <div className="mb-4">
                <Label htmlFor="nis" className="mb-1.5 block text-[13px] font-semibold text-[#1e293b]">NIS (Nomor Induk Santri) (opsional)</Label>
                <Input
                  id="nis"
                  type="text"
                  placeholder="Nomor induk santri"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="h-[44px] rounded-[10px] border-[#e2e8f0] text-sm focus-visible:ring-[#14b8a6]"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="kelas" className="mb-1.5 block text-[13px] font-semibold text-[#1e293b]">Kelas</Label>
                <Input
                  id="kelas"
                  type="text"
                  placeholder="Kelas"
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="h-[44px] rounded-[10px] border-[#e2e8f0] text-sm focus-visible:ring-[#14b8a6]"
                />
              </div>
            </>
          ) : null}

          {role === "musyrif" ? (
            <div className="mb-4">
              <Label htmlFor="spesialisasi" className="mb-1.5 block text-[13px] font-semibold text-[#1e293b]">Spesialisasi</Label>
              <Input
                id="spesialisasi"
                type="text"
                placeholder="Contoh: Tahfidz, Tajwid"
                value={spesialisasi}
                onChange={(e) => setSpesialisasi(e.target.value)}
                className="h-[44px] rounded-[10px] border-[#e2e8f0] text-sm focus-visible:ring-[#14b8a6]"
              />
            </div>
          ) : null}

          {role === "wali" ? (
            <>
              <div className="mb-4">
                <Label htmlFor="santri_id" className="mb-1.5 block text-[13px] font-semibold text-[#1e293b]">Santri Terkait</Label>
                <Select
                  value={santriId}
                  onChange={setSantriId}
                  placeholder="Pilih santri"
                  options={santriList.map((s) => ({
                    value: String(s.santri_id),
                    label: `${s.nama}${s.nis ? ` (${s.nis})` : ""}`,
                  }))}
                  className="h-[44px] rounded-[10px] border-[#e2e8f0] text-sm"
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="relasi" className="mb-1.5 block text-[13px] font-semibold text-[#1e293b]">Relasi</Label>
                <Input
                  id="relasi"
                  type="text"
                  placeholder="Contoh: Ayah, Ibu, Wali Santri"
                  value={relasi}
                  onChange={(e) => setRelasi(e.target.value)}
                  className="h-[44px] rounded-[10px] border-[#e2e8f0] text-sm focus-visible:ring-[#14b8a6]"
                />
              </div>
            </>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="h-[44px] w-full rounded-[10px] bg-[#0f766e] text-sm font-semibold text-white hover:bg-[#115e59]"
          >
            {loading ? "Memproses..." : "Daftar"}
          </Button>
        </form>
        <div className="mt-[18px] text-center text-[13px] text-[#64748b]">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-[#0f766e] hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
