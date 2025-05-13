"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportData } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

export function AppHeader() {
  const { toast } = useToast();

  const handleExportData = async () => {
    try {
      await exportData();
      toast({
        title: "Data Exported",
        description: "Your habit data has been successfully exported as a JSON file.",
        variant: "default",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
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
        <Button variant="outline" size="sm" onClick={handleExportData}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
    </header>
  );
}
