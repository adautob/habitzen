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
import { HABIT_CATEGORIES, HABIT_DIFFICULTIES, HABIT_FREQUENCIES } from "@/lib/constants";
import { PlusCircle, Edit } from "lucide-react";

const habitFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: z.string().min(1, "Category is required"),
  difficulty: z.coerce.number().min(1).max(3).transform(val => val as HabitDifficulty),
  frequency: z.enum(["daily", "weekly"]),
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
    },
  });

  useEffect(() => {
    if (existingHabit) {
      form.reset(existingHabit);
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
      });
      setCustomCategory("");
    }
  }, [existingHabit, form, isOpen]);


  const onSubmit = async (data: HabitFormData) => {
    const finalData = {
      ...data,
      category: data.category === "Other" && customCategory ? customCategory : data.category,
    };
    await onSave(finalData, existingHabit?.id);
    setIsOpen(false);
    form.reset();
    setCustomCategory("");
  };

  const categoryValue = form.watch("category");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton ? triggerButton : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> {existingHabit ? "Edit Habit" : "Add New Habit"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{existingHabit ? "Edit Habit" : "Add New Habit"}</DialogTitle>
          <DialogDescription>
            {existingHabit ? "Update the details of your habit." : "Fill in the details for your new habit."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Habit Name</Label>
            <Input id="name" {...form.register("name")} placeholder="e.g., Morning Run, Read 30 mins" />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Controller
              name="category"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {HABIT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {categoryValue === "Other" && (
              <Input
                placeholder="Enter custom category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-2"
              />
            )}
            {form.formState.errors.category && <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Controller
                name="difficulty"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={(val) => field.onChange(parseInt(val) as HabitDifficulty)} value={String(field.value)}>
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Select difficulty" />
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
              <Label htmlFor="frequency">Frequency</Label>
               <Controller
                name="frequency"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Select frequency" />
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : (existingHabit ? "Save Changes" : "Create Habit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
