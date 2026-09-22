export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request gagal (${res.status})`);
  return data as T;
}

export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });
export const put = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PUT", body: JSON.stringify(body) });
export const del = <T>(path: string) => api<T>(path, { method: "DELETE" });

export function fmtDate(v?: string | null): string {
  if (!v) return "-";
  const d = new Date(v.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export const JENIS_LABEL: Record<string, string> = {
  hafalan_baru: "Hafalan Baru",
  tambahan: "Tambahan",
  murajaah: "Murajaah",
};

export const NILAI_LABEL: Record<string, string> = {
  lancar: "Lancar",
  cukup_lancar: "Cukup Lancar",
  perlu_ulang: "Perlu Ulang",
};
