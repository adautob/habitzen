
"use client";
import { useState, useEffect, useRef } from "react";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";

interface ViewEditNoteDialogProps {
  habitLog: HabitLog | null;
  habitName: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaveNote: (logId: string, notes: string) => Promise<void>;
  onDeleteNote: (logId: string) => Promise<void>;
}

const commonEmojis = ["😊", "👍", "🎉", "💪", "🚀", "💡", "🤔", "😂", "🙏", "❤️", "🔥", "🌟"];

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
  const editNoteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  useEffect(() => {
    if (habitLog && habitLog.notes) {
      setNoteText(habitLog.notes);
    } else {
      setNoteText("");
    }
  }, [habitLog, isOpen]); // Re-evaluate on isOpen to reset if dialog reopens for different log

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

  const handleEmojiSelect = (emoji: string) => {
    if (editNoteTextareaRef.current) {
      const textarea = editNoteTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = noteText;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setNoteText(newText);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      });
    } else {
      setNoteText(prev => prev + emoji);
    }
    setEmojiPickerOpen(false);
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
            <div className="relative">
              <Textarea
                id="view-edit-note"
                ref={editNoteTextareaRef}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Adicione sua nota aqui..."
                rows={4}
                className="resize-none pr-10" // Padding for the emoji button
              />
              <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    aria-label="Adicionar emoji"
                  >
                    <SmilePlus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="flex flex-wrap gap-1 max-w-[160px]">
                    {commonEmojis.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-lg h-8 w-8"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <DialogFooter className="justify-between flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleDelete} disabled={!habitLog.notes && !noteText.trim()}>
              Excluir Nota
            </Button>
            <Button onClick={handleSave} disabled={noteText === (habitLog.notes || "") || (!noteText.trim() && !!habitLog.notes)}>
              Salvar Alterações
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

