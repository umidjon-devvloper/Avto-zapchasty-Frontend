'use client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { auth } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/utils';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';

export function Topbar({ title }: { title: string }) {
  const router = useRouter();
  const user = auth.getUser();

  const logout = () => {
    auth.clear();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-ink/80 backdrop-blur-md px-6">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">
        {user && (
          <div className="text-right leading-tight mr-2">
            <div className="font-mono text-sm">{user.phone}</div>
            <div className="text-[11px] text-amber">{ROLE_LABELS[user.role] || user.role}</div>
          </div>
        )}
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={logout} title="Chiqish">
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
