
"use client";
import { useState, useEffect } from "react";
import type { HabitLog } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ViewEditNoteDialogProps {
  habitLog: HabitLog | null;
  habitName: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaveNote: (logId: string, notes: string) => Promise<void>;
  onDeleteNote: (logId: string) => Promise<void>;
}

export function ViewEditNoteDialog({
  habitLog,
  habitName,
  isOpen,
  onOpenChange,
  onSaveNote,
  onDeleteNote,
}: ViewEditNoteDialogProps) {
  const [noteText, setNoteText] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (habitLog && habitLog.notes) {
      setNoteText(habitLog.notes);
    } else {
      setNoteText("");
    }
  }, [habitLog]);

  if (!habitLog) return null;

  const handleSave = async () => {
    if (!noteText.trim()) {
      toast({ title: "Nota Vazia", description: "A nota não pode estar vazia para salvar. Para remover, use 'Excluir Nota'.", variant: "destructive"});
      return;
    }
    await onSaveNote(habitLog.id, noteText);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    await onDeleteNote(habitLog.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nota para: {habitName}</DialogTitle>
          <DialogDescription>
            Veja, edite ou exclua a nota para este registro de hábito.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="view-edit-note" className="sr-only">
              Nota
            </Label>
            <Textarea
              id="view-edit-note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Adicione sua nota aqui..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter className="justify-between flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleDelete} disabled={!habitLog.notes}>
              Excluir Nota
            </Button>
            <Button onClick={handleSave} disabled={noteText === (habitLog.notes || "") || !noteText.trim()}>
              Salvar Alterações
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
