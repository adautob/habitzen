import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: 1 | 2 | 3;
  className?: string;
  starClassName?: string;
}

export function StarRating({ rating, className, starClassName }: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating ? "text-accent fill-accent" : "text-muted-foreground",
            starClassName
          )}
        />
      ))}
    </div>
  );
}
