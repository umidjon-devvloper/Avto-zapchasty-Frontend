import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-4 w-4 rounded-full border-2 border-line2 border-t-amber animate-[spin_0.6s_linear_infinite]',
        className
      )}
      aria-label="Yuklanmoqda"
    />
  );
}
