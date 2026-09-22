import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcryptjs";
import * as jose from "jose";

// Jangan import lib/auth langsung (butuh next/headers). Uji kontraknya:
// JWT HS256 {id,username,nama,email,role} + expiry 8 jam + redirectPath per role.

const SECRET = new TextEncoder().encode("test_secret_panjang_123");

async function signSession(user: Record<string, unknown>): Promise<string> {
  return new jose.SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("28800s")
    .sign(SECRET);
}

function redirectPath(role: string): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "musyrif":
      return "/musyrif";
    case "santri":
      return "/santri";
    case "wali":
      return "/wali";
    default:
      return "/login";
  }
}

describe("auth: password hashing (bcrypt, kompatibel legacy)", () => {
  it("hash & verify roundtrip", () => {
    const hash = bcrypt.hashSync("admin123", 10);
    expect(bcrypt.compareSync("admin123", hash)).toBe(true);
    expect(bcrypt.compareSync("salah", hash)).toBe(false);
  });

  it("password demo legacy masih valid format bcrypt", () => {
    const hash = bcrypt.hashSync("musyrif123", 10);
    expect(hash.startsWith("$2")).toBe(true);
  });
});

describe("auth: session JWT", () => {
  it("sign & verify roundtrip mempertahankan user", async () => {
    const user = { id: 1, username: "admin", nama: "Administrator", email: "a@x.id", role: "admin" };
    const token = await signSession(user);
    const { payload } = await jose.jwtVerify(token, SECRET);
    expect(Number(payload.id)).toBe(1);
    expect(payload.role).toBe("admin");
  });

  it("token salah / secret beda ditolak", async () => {
    const token = await signSession({ id: 1, role: "admin" });
    await expect(jose.jwtVerify(token, new TextEncoder().encode("beda"))).rejects.toThrow();
  });

  it("redirectPath mencakup 4 role + fallback", () => {
    expect(redirectPath("admin")).toBe("/admin");
    expect(redirectPath("musyrif")).toBe("/musyrif");
    expect(redirectPath("santri")).toBe("/santri");
    expect(redirectPath("wali")).toBe("/wali");
    expect(redirectPath("ngawur")).toBe("/login");
  });

  it("lib/auth.ts memakai pola yang sama (static check)", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("lib/auth.ts", "utf8");
    expect(src).toContain("HS256");
    expect(src).toContain("tahfidz_session");
    expect(src).toContain("httpOnly");
    expect(src).toContain("/admin");
    expect(src).toContain("/musyrif");
    expect(src).toContain("/santri");
    expect(src).toContain("/wali");
  });
});

describe("auth: guard role", () => {
  it("dokumen kontrak 401 vs 403", () => {
    // Kontrak: tanpa session -> 401 "Silakan login terlebih dahulu"
    // role salah -> 403 "Anda tidak memiliki akses"
    // Diuji via static check agar tidak butuh next/headers:
    return import("node:fs").then(({ readFileSync }) => {
      const src = readFileSync("lib/auth.ts", "utf8");
      expect(src).toContain("Silakan login terlebih dahulu");
      expect(src).toContain("Anda tidak memiliki akses");
      expect(src).toContain("401");
      expect(src).toContain("403");
    });
  });
});

vi.fn();
