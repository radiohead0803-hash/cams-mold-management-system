import React from 'react';
import { cn } from '@/lib/utils';

export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function Dialog({ open, onClose, title, children, className, ...props }: DialogProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 rounded-3xl p-6 z-50 shadow-xl',
          className
        )}
        {...props}
      >
        {title && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
