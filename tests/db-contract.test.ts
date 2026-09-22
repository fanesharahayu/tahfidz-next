import { describe, it, expect } from "vitest";
import { openTestDb, queryOn } from "@/lib/db";

// Mengunci kontrak query() agar bug register (result[0].lastID) tidak terulang.
// Legacy: const [result] = await query(INSERT...) -> result.lastID (BUKAN result[0]).
describe("query() contract (kompatibel legacy config/db.js)", () => {
  it("INSERT -> [info] dengan lastID (akses langsung, tanpa [0])", () => {
    const db = openTestDb();
    try {
      const [result] = queryOn(db, "INSERT INTO users (username, email, password, nama, role) VALUES (?, ?, ?, ?, ?)", [
        "u1",
        "u1@x.id",
        "hash",
        "User Satu",
        "santri",
      ]);
      expect(typeof result.lastID).toBe("number");
      expect(result.lastID).toBeGreaterThan(0);
      expect(result.insertId).toBe(result.lastID);
    } finally {
      db.close();
    }
  });

  it("SELECT -> [rows] berupa array", () => {
    const db = openTestDb();
    try {
      queryOn(db, "INSERT INTO users (username, email, password, nama, role) VALUES (?, ?, ?, ?, ?)", [
        "u2",
        "u2@x.id",
        "hash",
        "User Dua",
        "santri",
      ]);
      const [rows] = queryOn<{ username: string }>(db, "SELECT * FROM users WHERE username = ?", ["u2"]);
      expect(Array.isArray(rows)).toBe(true);
      expect(rows).toHaveLength(1);
      expect(rows[0].username).toBe("u2");
    } finally {
      db.close();
    }
  });

  it("UPDATE/DELETE -> [info] dengan affectedRows", () => {
    const db = openTestDb();
    try {
      queryOn(db, "INSERT INTO users (username, email, password, nama, role) VALUES (?, ?, ?, ?, ?)", [
        "u3",
        "u3@x.id",
        "hash",
        "User Tiga",
        "santri",
      ]);
      const [upd] = queryOn(db, "UPDATE users SET nama = ? WHERE username = ?", ["Baru", "u3"]);
      expect(upd.affectedRows).toBe(1);
      const [del] = queryOn(db, "DELETE FROM users WHERE username = ?", ["u3"]);
      expect(del.affectedRows).toBe(1);
      const [miss] = queryOn(db, "DELETE FROM users WHERE username = ?", ["tak-ada"]);
      expect(miss.affectedRows).toBe(0);
    } finally {
      db.close();
    }
  });

  it("tidak ada route yang memakai result[0] (pola bug register)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const bad: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name === "route.ts" && fs.readFileSync(p, "utf8").includes("result[0]")) bad.push(p);
      }
    };
    walk(path.join(process.cwd(), "app", "api"));
    expect(bad).toEqual([]);
  });
});
