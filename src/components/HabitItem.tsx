
"use client";
import type { Habit, HabitFormData, HabitLog } from "@/types";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Edit, Trash2, CalendarDays, Repeat, AlertTriangle, Zap, Home, Users, Layers, Dumbbell, Heart, Briefcase, BookOpen, DollarSign, Smile, TrendingUp, BarChart3 } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import { AddHabitDialog } from "./AddHabitDialog";
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
import { cva } from "class-variance-authority";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  isCompletedToday: boolean;
  onComplete: (habitId: string, date?: Date, notes?: string) => void;
  onEdit: (habitId: string, data: HabitFormData) => Promise<void>;
  onDelete: (habitId: string) => void;
}

export function HabitItem({ habit, habitLogs, isCompletedToday, onComplete, onEdit, onDelete }: HabitItemProps) {
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState("");

  const CategoryIcon = getCategoryIcon(habit.category);
  const frequencyText = habit.frequency === "daily" ? "Diário" : "Semanal";

  const handleCompleteClick = () => {
    if (isCompletedToday) {
      onComplete(habit.id); // Uncomplete
    } else {
      setCurrentNote(""); // Reset note for new completion
      setIsNoteDialogOpen(true); // Open note dialog
    }
  };

  const handleSaveCompletion = (withNote: boolean) => {
    onComplete(habit.id, new Date(), withNote ? currentNote : undefined);
    setIsNoteDialogOpen(false);
    setCurrentNote("");
  };

  return (
    <>
      <Card className={cn("transition-all hover:shadow-md flex flex-col", isCompletedToday ? "bg-success/10 border-success" : "")}>
        <CardHeader>
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
        <CardContent className="flex-grow">
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
        <CardFooter>
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

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
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
              <Textarea
                id="habit-note"
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Ex: Corri 5km hoje, me senti ótimo!"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between gap-2">
             <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => handleSaveCompletion(false)}>
                Concluir sem Nota
              </Button>
              <Button onClick={() => handleSaveCompletion(true)}>
                Salvar e Concluir
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
    },
    defaultVariants: { variant: "default" },
  }
);
