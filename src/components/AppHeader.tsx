
"use client";
import { Download, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportData } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

export function AppHeader() {
  const { toast } = useToast();
  const { effectiveTheme, toggleTheme } = useTheme();

  const handleExportData = async () => {
    try {
      await exportData();
      toast({
        title: "Dados Exportados",
        description: "Seus dados de hábitos foram exportados com sucesso como um arquivo JSON.",
        variant: "default",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Falha na Exportação",
        description: "Ocorreu um erro ao exportar seus dados. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6 text-primary"
          >
            <path d="M12 22a10 10 0 0 0 10-10H2a10 10 0 0 0 10 10z" />
            <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
            <path d="M12 12v10" />
          </svg>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            HabitZen
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Dados
          </Button>
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
            {effectiveTheme === 'dark' ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
