
"use client";
import type { Habit, HabitFormData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Edit, Trash2, CalendarDays, Repeat, AlertTriangle, Zap, Home, Users, Layers, Dumbbell, Heart, Briefcase, BookOpen, DollarSign, Smile, TrendingUp } from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import { AddHabitDialog } from "./AddHabitDialog";
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

// Icon definitions
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
  Fitness: DumbbellIcon,
  Health: HeartIcon,
  Work: BriefcaseIcon,
  Learning: BookOpenIcon,
  Finance: DollarSignIcon,
  Hobbies: SmileIcon,
  "Personal Growth": TrendingUpIcon,
  Home: HomeIcon,
  Social: UsersIcon,
  Other: LayersIcon,
};

function getCategoryIcon(category: string) {
  const normalizedCategory = category.toLowerCase();
  for (const key in categoryIcons) {
    if (key.toLowerCase() === normalizedCategory) {
      return categoryIcons[key];
    }
  }
  // Try to find a partial match for common terms
  if (normalizedCategory.includes("fit") || normalizedCategory.includes("gym") || normalizedCategory.includes("exercise")) return DumbbellIcon;
  if (normalizedCategory.includes("health") || normalizedCategory.includes("meditat")) return HeartIcon;
  if (normalizedCategory.includes("work") || normalizedCategory.includes("job") || normalizedCategory.includes("career")) return BriefcaseIcon;
  if (normalizedCategory.includes("learn") || normalizedCategory.includes("study") || normalizedCategory.includes("book")) return BookOpenIcon;
  
  return categoryIcons["Other"]; // Default icon
}

interface HabitItemProps {
  habit: Habit;
  isCompletedToday: boolean;
  onComplete: (habitId: string) => void;
  onEdit: (habitId: string, data: HabitFormData) => Promise<void>;
  onDelete: (habitId: string) => void;
}

export function HabitItem({ habit, isCompletedToday, onComplete, onEdit, onDelete }: HabitItemProps) {
  const CategoryIcon = getCategoryIcon(habit.category);

  return (
    <Card className={cn("transition-all hover:shadow-md", isCompletedToday ? "bg-success/10 border-success" : "")}>
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
          <div className="flex items-center space-x-1">
             <AddHabitDialog
                onSave={async (data) => onEdit(habit.id, data)}
                existingHabit={habit}
                triggerButton={
                  <Button variant="ghost" size="icon" aria-label="Edit habit">
                    <Edit className="h-4 w-4" />
                  </Button>
                }
              />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Delete habit" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the habit "{habit.name}" and all its logs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(habit.id)} className={buttonVariants({variant: "destructive"})}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            {habit.frequency === "daily" ? <CalendarDays className="mr-1.5 h-4 w-4" /> : <Repeat className="mr-1.5 h-4 w-4" />}
            {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
          </div>
          <div className="flex items-center">
            <Zap className="mr-1.5 h-4 w-4 text-amber-500" />
            {habit.points} points
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onComplete(habit.id)}
          variant={isCompletedToday ? "secondary" : "default"}
          className="w-full"
        >
          {isCompletedToday ? (
            <>
              <XCircle className="mr-2 h-4 w-4" /> Unmark as Complete
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" /> Mark as Complete Today
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ShadCN buttonVariants for destructive action in AlertDialog
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
