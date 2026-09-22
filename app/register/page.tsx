"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Daftar Akun Baru</CardTitle>
          <CardDescription>Lengkapi data di bawah untuk membuat akun</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                type="text"
                placeholder="Nama lengkap"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Peran</Label>
              <Select
                value={role}
                onChange={setRole}
                options={[
                  { value: "santri", label: "Santri" },
                  { value: "musyrif", label: "Musyrif" },
                  { value: "wali", label: "Wali" },
                ]}
              />
            </div>

            {role === "santri" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nis">NIS</Label>
                  <Input
                    id="nis"
                    type="text"
                    placeholder="Nomor induk santri"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kelas">Kelas</Label>
                  <Input
                    id="kelas"
                    type="text"
                    placeholder="Kelas"
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                  />
                </div>
              </>
            ) : null}

            {role === "musyrif" ? (
              <div className="space-y-2">
                <Label htmlFor="spesialisasi">Spesialisasi</Label>
                <Input
                  id="spesialisasi"
                  type="text"
                  placeholder="Contoh: Tahfidz, Tajwid"
                  value={spesialisasi}
                  onChange={(e) => setSpesialisasi(e.target.value)}
                />
              </div>
            ) : null}

            {role === "wali" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="santri_id">Santri Terkait</Label>
                  <Select
                    value={santriId}
                    onChange={setSantriId}
                    placeholder="Pilih santri"
                    options={santriList.map((s) => ({
                      value: String(s.santri_id),
                      label: `${s.nama}${s.nis ? ` (${s.nis})` : ""}`,
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relasi">Relasi</Label>
                  <Input
                    id="relasi"
                    type="text"
                    placeholder="Contoh: Ayah, Ibu, Wali Santri"
                    value={relasi}
                    onChange={(e) => setRelasi(e.target.value)}
                  />
                </div>
              </>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Daftar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
