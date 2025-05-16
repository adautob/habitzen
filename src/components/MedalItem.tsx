
"use client";
import type { Medal } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle, Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MedalItemProps {
  medal: Medal;
}

export function MedalItem({ medal }: MedalItemProps) {
  const Icon = medal.icon;
  const isAchieved = medal.achievedAt !== null;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={cn(
            "text-center transition-all hover:shadow-lg",
            isAchieved ? "border-green-500 bg-green-500/10" : "border-dashed opacity-70 hover:opacity-100"
          )}>
            <CardHeader className="pb-2">
              <div className="flex justify-center mb-2">
                <Icon className={cn("h-10 w-10", isAchieved ? "text-green-600" : "text-muted-foreground")} />
              </div>
              <CardTitle className="text-base">{medal.name}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <CardDescription className="text-xs">
                {medal.description}
              </CardDescription>
              {isAchieved && medal.achievedAt && (
                 <p className="text-xs text-green-700 mt-2">
                    Conquistada em: {format(new Date(medal.achievedAt), "dd/MM/yyyy", { locale: ptBR })}
                 </p>
              )}
            </CardContent>
            {isAchieved ? (
              <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-green-500" />
            ) : (
              <Lock className="absolute top-2 right-2 h-5 w-5 text-muted-foreground" />
            )}
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          <p className="font-semibold">{medal.name}</p>
          <p className="text-xs text-muted-foreground">{medal.group}</p>
          {isAchieved && medal.achievedAt ? (
            <p className="text-xs">Conquistada!</p>
          ) : (
            <p className="text-xs">Ainda não conquistada.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
