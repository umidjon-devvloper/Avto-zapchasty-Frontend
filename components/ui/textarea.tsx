'use client';
import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded border border-line bg-panel px-3 py-2 text-sm text-fg placeholder:text-muted/60',
        'focus:border-amber focus:outline-none transition-colors resize-y min-h-[80px]',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
