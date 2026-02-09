import React from 'react';
import { cn } from '@/lib/utils';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('bg-card text-card-foreground rounded-lg border shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}
