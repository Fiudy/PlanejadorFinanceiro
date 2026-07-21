import { LogOut, Database, HardDrive } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { useAuth } from "@/app/auth-context";
import { container } from "@/infrastructure/di/container";

export function ProfileSection() {
  const { user, signOut } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium text-ink-950 dark:text-paper-50">{user?.name || "Usuário"}</p>
          <p className="text-xs text-muted-500">{user?.email}</p>
        </div>
        <div>
          <Badge tone={container.usingFirebase ? "accent" : "muted"} className="gap-1.5">
            {container.usingFirebase ? <Database className="h-3 w-3" /> : <HardDrive className="h-3 w-3" />}
            {container.usingFirebase ? "Conectado ao Firebase" : "Modo local (sem Firebase configurado)"}
          </Badge>
        </div>
        <Button variant="secondary" onClick={() => void signOut()} className="mt-2 justify-center">
          <LogOut className="h-4 w-4" />
          Sair da conta
        </Button>
      </div>
    </Card>
  );
}
