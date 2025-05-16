
"use client";
import type { Habit, HabitFormData, HabitLog } from "@/types";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Edit, Trash2, CalendarDays, Repeat, AlertTriangle, Zap, Home, Users, Layers, Dumbbell, Heart, Briefcase, BookOpen, DollarSign, Smile, TrendingUp, BarChart3, FileText, SmilePlus } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import { AddHabitDialog } from "./AddHabitDialog";
import { ViewEditNoteDialog } from "./ViewEditNoteDialog";
import { HabitConsistencyHeatmap } from "./HabitConsistencyHeatmap";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const HomeIcon = Home;
const UsersIcon = Users;
const LayersIcon = Layers;
const DumbbellIcon = Dumbbell;
const HeartIcon = Heart;
const BriefcaseIcon = Briefcase;
const BookOpenIcon = BookOpen;
const DollarSignIcon = DollarSign;
const SmileIcon = Smile; 
const TrendingUpIcon = TrendingUp;

const categoryIcons: Record<string, React.ElementType> = {
  "Fitness": DumbbellIcon,
  "Saúde": HeartIcon,
  "Trabalho": BriefcaseIcon,
  "Aprendizado": BookOpenIcon,
  "Finanças": DollarSignIcon,
  "Hobbies": SmileIcon,
  "Crescimento Pessoal": TrendingUpIcon,
  "Casa": HomeIcon,
  "Social": UsersIcon,
  "Outro": LayersIcon,
};

function getCategoryIcon(category: string) {
  const normalizedCategory = category.toLowerCase();
  if (categoryIcons[category]) {
    return categoryIcons[category];
  }
  for (const key in categoryIcons) {
    if (key.toLowerCase() === normalizedCategory) {
      return categoryIcons[key];
    }
  }
  if (normalizedCategory.includes("fit") || normalizedCategory.includes("academia") || normalizedCategory.includes("exercício")) return DumbbellIcon;
  if (normalizedCategory.includes("saude") || normalizedCategory.includes("saúde") || normalizedCategory.includes("medita")) return HeartIcon;
  if (normalizedCategory.includes("trabalho") || normalizedCategory.includes("carreira")) return BriefcaseIcon;
  if (normalizedCategory.includes("aprender") || normalizedCategory.includes("estudar") || normalizedCategory.includes("livro")) return BookOpenIcon;

  return categoryIcons["Outro"];
}

interface HabitItemProps {
  habit: Habit;
  habitLogs: HabitLog[];
  todayLog: HabitLog | undefined;
  onComplete: (habitId: string, date?: Date, notes?: string) => void;
  onEdit: (habitId: string, data: HabitFormData) => Promise<void>;
  onDelete: (habitId: string) => void;
  onUpdateLogNotes: (logId: string, notes: string | undefined) => Promise<void>;
}

const commonEmojis = ["😊", "👍", "🎉", "💪", "🚀", "💡", "🤔", "😂", "🙏", "❤️", "🔥", "🌟"];

export function HabitItem({ habit, habitLogs, todayLog, onComplete, onEdit, onDelete, onUpdateLogNotes }: HabitItemProps) {
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  const [isViewEditNoteDialogOpen, setIsViewEditNoteDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState("");
  const [addNoteEmojiPickerOpen, setAddNoteEmojiPickerOpen] = useState(false);
  const addNoteTextareaRef = useRef<HTMLTextAreaElement>(null);


  const CategoryIcon = getCategoryIcon(habit.category);
  const frequencyText = habit.frequency === "daily" ? "Diário" : "Semanal";
  const isCompletedToday = !!todayLog;

  const handleCompleteClick = () => {
    if (isCompletedToday) {
      onComplete(habit.id); 
    } else {
      setCurrentNote(""); 
      setIsAddNoteDialogOpen(true); 
    }
  };

  const handleSaveCompletionWithNote = (withNote: boolean) => {
    onComplete(habit.id, new Date(), withNote ? currentNote : undefined);
    setIsAddNoteDialogOpen(false);
    setCurrentNote("");
  };

  const handleSaveEditedNote = async (logId: string, notes: string) => {
    await onUpdateLogNotes(logId, notes);
  };

  const handleDeleteNote = async (logId: string) => {
    await onUpdateLogNotes(logId, undefined);
  };

  const handleAddNoteEmojiSelect = (emoji: string) => {
    if (addNoteTextareaRef.current) {
      const textarea = addNoteTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = currentNote;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setCurrentNote(newText);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      });
    } else {
      setCurrentNote(prev => prev + emoji);
    }
    setAddNoteEmojiPickerOpen(false);
  };


  return (
    <>
      <Card className={cn(
        "transition-all hover:shadow-md flex flex-col relative overflow-hidden", 
        isCompletedToday ? "bg-success/10 border-success" : ""
      )}>
        {habit.color && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-1.5"
            style={{ backgroundColor: habit.color }}
          />
        )}
        <CardHeader className={cn("pl-5", habit.color && "pl-8")}> {/* Adjust padding if color bar is present */}
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                {CategoryIcon && <CategoryIcon className="mr-2 h-5 w-5 text-primary" />}
                {habit.name}
              </CardTitle>
              <CardDescription className="mt-1">
                <Badge variant="secondary" className="mr-2">{habit.category}</Badge>
                 <StarRating rating={habit.difficulty} />
              </CardDescription>
            </div>
            <div className="flex items-center space-x-0.5">
               {isCompletedToday && todayLog?.notes && (
                 <TooltipProvider delayDuration={100}>
                   <Tooltip>
                     <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ver/Editar Nota" onClick={() => setIsViewEditNoteDialogOpen(true)}>
                          <FileText className="h-4 w-4 text-blue-500" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent side="top"><p>Ver/Editar Nota</p></TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
               )}
               <Dialog open={isHeatmapOpen} onOpenChange={setIsHeatmapOpen}>
                  <TooltipProvider delayDuration={100}>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="Ver consistência">
                                      <BarChart3 className="h-4 w-4" />
                                  </Button>
                              </DialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                              <p>Ver Consistência</p>
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
                  <DialogContent className="max-w-3xl">
                      <DialogHeader>
                          <DialogTitle>Consistência de "{habit.name}"</DialogTitle>
                      </DialogHeader>
                      <HabitConsistencyHeatmap habit={habit} habitLogs={habitLogs} />
                  </DialogContent>
              </Dialog>

               <AddHabitDialog
                  onSave={async (data) => onEdit(habit.id, data)}
                  existingHabit={habit}
                  triggerButton={
                    <Button variant="ghost" size="icon" aria-label="Editar hábito">
                      <Edit className="h-4 w-4" />
                    </Button>
                  }
                />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Excluir hábito" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente o hábito "{habit.name}" e todos os seus registros.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(habit.id)} className={buttonVariants({variant: "destructive"})}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn("flex-grow", habit.color && "pl-8")}>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              {habit.frequency === "daily" ? <CalendarDays className="mr-1.5 h-4 w-4" /> : <Repeat className="mr-1.5 h-4 w-4" />}
              {frequencyText}
            </div>
            <div className="flex items-center">
              <Zap className="mr-1.5 h-4 w-4 text-amber-500" />
              {habit.points} pontos
            </div>
          </div>
        </CardContent>
        <CardFooter className={cn(habit.color && "pl-8")}>
          <Button
            onClick={handleCompleteClick}
            variant={isCompletedToday ? "secondary" : "default"}
            className="w-full"
          >
            {isCompletedToday ? (
              <>
                <XCircle className="mr-2 h-4 w-4" /> Desmarcar Conclusão
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Concluído
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Dialog for adding note on new completion */}
      <Dialog open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Nota (Opcional)</DialogTitle>
            <DialogDescription>
              Adicione uma nota à conclusão do hábito "{habit.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="habit-note" className="sr-only">
                Nota
              </Label>
              <div className="relative">
                <Textarea
                  id="habit-note"
                  ref={addNoteTextareaRef}
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Ex: Corri 5km hoje, me senti ótimo!"
                  rows={3}
                  className="pr-10" 
                />
                <Popover open={addNoteEmojiPickerOpen} onOpenChange={setAddNoteEmojiPickerOpen}>
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
                          onClick={() => handleAddNoteEmojiSelect(emoji)}
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
          <DialogFooter className="sm:justify-between gap-2 flex-col sm:flex-row">
             <Button variant="outline" onClick={() => setIsAddNoteDialogOpen(false)}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => handleSaveCompletionWithNote(false)}>
                Concluir sem Nota
              </Button>
              <Button onClick={() => handleSaveCompletionWithNote(true)}>
                Salvar e Concluir
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for viewing/editing existing note */}
      {todayLog && (
        <ViewEditNoteDialog
          habitLog={todayLog}
          habitName={habit.name}
          isOpen={isViewEditNoteDialogOpen}
          onOpenChange={setIsViewEditNoteDialogOpen}
          onSaveNote={handleSaveEditedNote}
          onDeleteNote={handleDeleteNote}
        />
      )}
    </>
  );
}
