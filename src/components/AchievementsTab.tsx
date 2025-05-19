
"use client";
import type { Medal } from "@/types";
import { MedalItem } from "./MedalItem";
import { MEDAL_DEFINITIONS } from "@/lib/medalsData";
import { Skeleton } from "./ui/skeleton";
import Image from "next/image";

interface AchievementsTabProps {
  achievedMedals: Medal[];
  isLoading: boolean;
}

export function AchievementsTab({ achievedMedals, isLoading }: AchievementsTabProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(MEDAL_DEFINITIONS.length)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const allMedalsWithStatus = MEDAL_DEFINITIONS.map(def => {
    const achievedVersion = achievedMedals.find(am => am.id === def.id);
    return achievedVersion ? achievedVersion : { ...def, achievedAt: null };
  });

  if (allMedalsWithStatus.length === 0) { // Should not happen if MEDAL_DEFINITIONS is populated
    return (
       <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
         <Image
            src="https://placehold.co/200x133.png"
            alt="Nenhuma conquista definida"
            width={200}
            height={133}
            className="mb-4 rounded-md"
            data-ai-hint="trophy shelf"
        />
        <h3 className="text-xl font-semibold">Nenhuma Conquista Definida</h3>
        <p className="text-muted-foreground">
          Parece que ainda não há medalhas para conquistar.
        </p>
      </div>
    );
  }
  
  const groupedMedals = allMedalsWithStatus.reduce((acc, medal) => {
    const group = medal.group || "Outras";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(medal);
    return acc;
  }, {} as Record<string, Medal[]>);


  return (
    <div className="space-y-8">
      {Object.entries(groupedMedals).map(([groupName, medalsInGroup]) => (
        <section key={groupName}>
          <h2 className="text-2xl font-semibold mb-4 tracking-tight">{groupName}</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {medalsInGroup.map((medal) => (
              <MedalItem key={medal.id} medal={medal} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}


function CardSkeleton() {
  return (
    <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg shadow h-[180px] justify-center">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-[20px] w-[100px] rounded-md" />
      <Skeleton className="h-[14px] w-[120px] rounded-md" />
       <Skeleton className="h-[12px] w-[80px] rounded-md mt-1" />
    </div>
  );
}
