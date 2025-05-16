
import type { MedalDefinition } from "@/types";
import { Award, CalendarCheck, ListPlus, Star, TrendingUp } from "lucide-react";

export const MEDAL_DEFINITIONS: MedalDefinition[] = [
  {
    id: "beginner_steps",
    name: "Primeiros Passos",
    description: "Crie seu primeiro hábito e comece sua jornada.",
    icon: Award,
    group: "Criação",
  },
  {
    id: "perfect_week_daily",
    name: "Semana Impecável",
    description: "Complete um hábito diário por 7 dias seguidos.",
    icon: CalendarCheck,
    group: "Consistência",
  },
  {
    id: "habit_collector_5",
    name: "Colecionador de Hábitos",
    description: "Mantenha 5 hábitos ativos simultaneamente.",
    icon: ListPlus,
    group: "Criação",
  },
  {
    id: "point_hoarder_1000",
    name: "Acumulador de Pontos",
    description: "Alcance um total de 1000 pontos de hábitos.",
    icon: Star,
    group: "Pontuação",
  },
  {
    id: "streak_master_30",
    name: "Mestre da Sequência",
    description: "Mantenha qualquer hábito com uma sequência de 30 dias.",
    icon: TrendingUp,
    group: "Consistência",
  },
  // Adicione mais medalhas aqui conforme necessário
];
