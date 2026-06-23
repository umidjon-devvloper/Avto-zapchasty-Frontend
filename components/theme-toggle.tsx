'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      title={theme === 'dark' ? 'Kunduzgi rejim' : 'Tungi rejim'}
      className="transition-transform active:scale-90"
    >
      {theme === 'dark'
        ? <Sun size={18} className="text-amber" />
        : <Moon size={18} />
      }
    </Button>
  );
}
