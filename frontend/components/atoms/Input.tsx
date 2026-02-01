import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-500">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-14 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0e0e0e] px-4 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-600 transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none',
              icon && 'pl-12',
              error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500 px-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
