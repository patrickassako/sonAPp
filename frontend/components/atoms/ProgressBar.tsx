import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    className?: string;
}

export function ProgressBar({ currentStep, totalSteps, className }: ProgressBarProps) {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className={cn('w-full', className)}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm font-bold text-primary">
                    {Math.round(progress)}% Complete
                </span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-border-dark rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
