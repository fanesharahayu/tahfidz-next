import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getProfile } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/dialog";

export default async function ProfilPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const profile = await getProfile(user);
  const p = (profile ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (v === null || v === undefined ? "-" : String(v));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Profil Saya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={user.nama} className="h-14 w-14 text-lg" />
            <div className="space-y-1">
              <p className="text-lg font-semibold">{user.nama}</p>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Nama</dt>
              <dd className="font-medium">{str(p.nama ?? user.nama)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Username</dt>
              <dd className="font-medium">{user.username}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{str(p.email ?? user.email)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Peran</dt>
              <dd className="font-medium capitalize">{user.role}</dd>
            </div>
          </dl>

          {user.role === "santri" ? (
            <dl className="grid grid-cols-1 gap-3 border-t pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">NIS</dt>
                <dd className="font-medium">{str(p.nis)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Kelas</dt>
                <dd className="font-medium">{str(p.kelas)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Musyrif</dt>
                <dd className="font-medium">{str(p.musyrif_nama)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Target Juz</dt>
                <dd className="font-medium">{str(p.target_juz)}</dd>
              </div>
            </dl>
          ) : null}

          {user.role === "musyrif" ? (
            <dl className="grid grid-cols-1 gap-3 border-t pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Spesialisasi</dt>
                <dd className="font-medium">{str(p.spesialisasi)}</dd>
              </div>
            </dl>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
