import { Moon, Sun } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { useThemeStore } from "@/shared/theme/theme-store";

export function AppearanceSection() {
  const { mode, setMode } = useThemeStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
      </CardHeader>
      <div className="flex gap-3">
        <Button
          variant={mode === "light" ? "primary" : "secondary"}
          onClick={() => setMode("light")}
          className="flex-1 justify-center"
        >
          <Sun className="h-4 w-4" />
          Claro
        </Button>
        <Button
          variant={mode === "dark" ? "primary" : "secondary"}
          onClick={() => setMode("dark")}
          className="flex-1 justify-center"
        >
          <Moon className="h-4 w-4" />
          Escuro
        </Button>
      </div>
    </Card>
  );
}
