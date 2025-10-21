
"use client";
import { Sun, Moon, LogIn, LogOut } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser } from "@/firebase/auth/use-user";
import { signOut } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const { effectiveTheme, toggleTheme } = useTheme();
  const { user, isLoading } = useUser();

  const UserAvatar = () => {
    if (isLoading) {
      return null;
    }

    if (!user) {
      return (
        <Link href="/login" passHref>
          <Button variant="outline">
            <LogIn className="mr-2 h-4 w-4" />
            Login
          </Button>
        </Link>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'Usuário'} />
              <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6 text-primary"
          >
            <path d="M12 22a10 10 0 0 0 10-10H2a10 10 0 0 0 10 10z" />
            <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
            <path d="M12 12v10" />
          </svg>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            HabitZen
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
            {effectiveTheme === 'dark' ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
          </Button>
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}
