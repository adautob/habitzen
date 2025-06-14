
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Habit, HabitFormData, HabitDifficulty, HabitFrequency } from "@/types";
import { HABIT_CATEGORIES, HABIT_DIFFICULTIES, HABIT_FREQUENCIES, HABIT_COLORS } from "@/lib/constants";
import { PlusCircle, Edit, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const habitFormSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório").max(100),
  category: z.string().min(1, "A categoria é obrigatória"),
  difficulty: z.coerce.number().min(1).max(3).transform(val => val as HabitDifficulty),
  frequency: z.enum(["daily", "weekly"]),
  color: z.string().optional(),
});

interface AddHabitDialogProps {
  onSave: (data: HabitFormData, habitId?: string) => Promise<void>;
  existingHabit?: Habit;
  triggerButton?: React.ReactNode;
}

export function AddHabitDialog({ onSave, existingHabit, triggerButton }: AddHabitDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const form = useForm<HabitFormData>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: existingHabit || {
      name: "",
      category: HABIT_CATEGORIES[0],
      difficulty: 1 as HabitDifficulty,
      frequency: "daily" as HabitFrequency,
      color: HABIT_COLORS[0].value,
    },
  });

  useEffect(() => {
    if (existingHabit) {
      form.reset({
        ...existingHabit,
        color: existingHabit.color || HABIT_COLORS[0].value,
      });
      if (!HABIT_CATEGORIES.includes(existingHabit.category)) {
        setCustomCategory(existingHabit.category);
      } else {
        setCustomCategory("");
      }
    } else {
      form.reset({
        name: "",
        category: HABIT_CATEGORIES[0],
        difficulty: 1 as HabitDifficulty,
        frequency: "daily" as HabitFrequency,
        color: HABIT_COLORS[0].value,
      });
      setCustomCategory("");
    }
  }, [existingHabit, form, isOpen]);


  const onSubmit = async (data: HabitFormData) => {
    const finalData = {
      ...data,
      category: data.category === "Outro" && customCategory ? customCategory : data.category,
      color: data.color === HABIT_COLORS[0].value ? undefined : data.color, // Store undefined if default color
    };
    await onSave(finalData, existingHabit?.id);
    setIsOpen(false);
    form.reset();
    setCustomCategory("");
  };

  const categoryValue = form.watch("category");
  const selectedColor = form.watch("color");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton ? triggerButton : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> {existingHabit ? "Editar Hábito" : "Adicionar Novo Hábito"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{existingHabit ? "Editar Hábito" : "Adicionar Novo Hábito"}</DialogTitle>
          <DialogDescription>
            {existingHabit ? "Atualize os detalhes do seu hábito." : "Preencha os detalhes para o seu novo hábito."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Hábito</Label>
            <Input id="name" {...form.register("name")} placeholder="ex: Corrida Matinal, Ler 30 min" />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Controller
              name="category"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {HABIT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {categoryValue === "Outro" && (
              <Input
                placeholder="Digite o nome da categoria personalizada"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-2"
              />
            )}
            {form.formState.errors.category && <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="difficulty">Dificuldade</Label>
              <Controller
                name="difficulty"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={(val) => field.onChange(parseInt(val) as HabitDifficulty)} value={String(field.value)}>
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Selecione a dificuldade" />
                    </SelectTrigger>
                    <SelectContent>
                      {HABIT_DIFFICULTIES.map((diff) => (
                        <SelectItem key={diff.value} value={String(diff.value)}>{diff.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.difficulty && <p className="text-xs text-destructive">{form.formState.errors.difficulty.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="frequency">Frequência</Label>
               <Controller
                name="frequency"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      {HABIT_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.frequency && <p className="text-xs text-destructive">{form.formState.errors.frequency.message}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Cor do Hábito</Label>
            <Controller
              name="color"
              control={form.control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {HABIT_COLORS.map((colorOption) => (
                    <Button
                      key={colorOption.name}
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-8 w-8 p-0 rounded-full border-2",
                        selectedColor === colorOption.value
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-gray-300"
                      )}
                      style={{ backgroundColor: colorOption.value || 'hsl(var(--muted))' }} // Use HSL for custom colors
                      onClick={() => field.onChange(colorOption.value)}
                      aria-label={`Selecionar cor ${colorOption.name}`}
                    >
                      {selectedColor === colorOption.value && <Check className="h-4 w-4 text-primary-foreground" />}
                      {colorOption.value === "" && selectedColor !== "" && <span className="text-xs text-muted-foreground">?</span>}
                    </Button>
                  ))}
                </div>
              )}
            />
             {form.formState.errors.color && <p className="text-xs text-destructive">{form.formState.errors.color.message}</p>}
          </div>


          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Salvando..." : (existingHabit ? "Salvar Alterações" : "Criar Hábito")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
