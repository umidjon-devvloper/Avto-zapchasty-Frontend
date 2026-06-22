import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'amber' | 'success' | 'danger' | 'info' | 'muted';
const tones: Record<Tone, string> = {
  neutral: 'bg-panel2 text-fg border-line2',
  amber: 'bg-amber/15 text-amber border-amber/30',
  success: 'bg-success/15 text-success border-success/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  info: 'bg-info/15 text-info border-info/30',
  muted: 'bg-panel2 text-muted border-line',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

// Status -> tone
export const STATUS_TONE: Record<string, Tone> = {
  active: 'success', pending: 'amber', rejected: 'danger',
  sold: 'info', archived: 'muted', draft: 'muted',
};
