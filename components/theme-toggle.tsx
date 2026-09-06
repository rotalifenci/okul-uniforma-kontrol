'use client';

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
      localStorage.getItem('theme') === 'dark';

    if (isDark) {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-xl h-10 w-10 text-muted-foreground hover:text-foreground"
      title={theme === 'light' ? 'Koyu temaya geç' : 'Açık temaya geç'}
      aria-label="Tema değiştir"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 transition-transform duration-200 rotate-0 hover:-rotate-12" />
      ) : (
        <Sun className="h-5 w-5 transition-transform duration-200 rotate-0 hover:rotate-45 text-amber-400" />
      )}
    </Button>
  );
}
