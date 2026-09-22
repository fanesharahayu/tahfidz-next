"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Tampilan disamakan dengan proyek lama (auth-card emerald + logo 📖).
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Username/email dan password wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const data = await post<{ redirect?: string }>("/api/auth/login", { username, password });
      router.push(data.redirect || "/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#115e59_0%,#0f766e_50%,#134e4a_100%)] p-5">
      <div className="w-full max-w-[420px] rounded-[18px] bg-white px-9 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f766e,#14b8a6)] text-3xl text-white">
            📖
          </div>
          <h1 className="text-[22px] font-semibold text-[#115e59]">Tahfidz Monitor</h1>
          <p className="mt-1 text-[13px] text-[#64748b]">Sistem Monitoring Hafalan Al-Qur&apos;an</p>
        </div>

        <div
          className={cn(
            "mb-4 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] text-[#dc2626]",
            !error && "hidden"
          )}
          role={error ? "alert" : undefined}
        >
          {error}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="username" className="mb-1.5 block text-[13px] font-semibold text-[#1e293b]">
              Username / Email
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Masukkan username atau email"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="h-[44px] rounded-[10px] border-[#e2e8f0] text-sm focus-visible:ring-[#14b8a6]"
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-[#1e293b]">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Masukkan password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-[44px] rounded-[10px] border-[#e2e8f0] text-sm focus-visible:ring-[#14b8a6]"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-[44px] w-full rounded-[10px] bg-[#0f766e] text-sm font-semibold text-white hover:bg-[#115e59]"
          >
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <div className="mt-[18px] text-center text-[13px] text-[#64748b]">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-[#0f766e] hover:underline">
            Daftar sebagai Musyrif / Santri / Wali
          </Link>
        </div>
      </div>
    </div>
  );
}
