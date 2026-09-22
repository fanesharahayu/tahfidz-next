import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tahfidz Monitoring",
  description: "Aplikasi monitoring hafalan santri",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="font-sans">{children}</body>
    </html>
  );
}
