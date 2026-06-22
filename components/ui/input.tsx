'use client';
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded border border-line bg-panel px-3 text-sm text-fg placeholder:text-muted/60',
        'focus:border-amber focus:outline-none transition-colors',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
