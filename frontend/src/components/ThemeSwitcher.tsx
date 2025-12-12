// components/ThemeSwitcher.tsx
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useColorScheme } from '@mui/material/styles';


export function ThemeSwitcher() {

  const { theme, setTheme } = useTheme();

  const { setMode } = useColorScheme();


  const [mounted, setMounted] = useState(false);

  // Avoid hydration issues
  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'q') {
        setTheme(theme === 'dark' ? 'light' : 'dark')
        setMode(theme === 'dark' ? 'light' : 'dark')
        event.preventDefault(); // Prevent default browser behavio
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
  
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [theme, setTheme, setMode]);

  if (!mounted) return null;

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="switch-theme"
        className="bg-gray-200 dark:bg-gray-800"
        checked={theme === 'dark'}
        onCheckedChange={() => {
          setTheme(theme === 'dark' ? 'light' : 'dark')
          setMode(theme === 'dark' ? 'light' : 'dark')

        }}
      />
      <Label htmlFor="switch-theme" className="text-black dark:text-white">
        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
      </Label>
    </div>
  );
}
