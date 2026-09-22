import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 adalah modul native — jangan di-bundle, pakai dari node_modules.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
