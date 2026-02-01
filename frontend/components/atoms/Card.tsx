import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-xl border',
                    variant === 'glass'
                        ? 'glass-card'
                        : 'border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark',
                    className
                )}
                {...props}
            />
        );
    }
);

Card.displayName = 'Card';

export { Card };
