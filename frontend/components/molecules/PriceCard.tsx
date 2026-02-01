import React from 'react';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';

interface PriceCardProps {
    name: string;
    credits: number;
    price: string;
    description: string;
    features: string[];
    isPopular?: boolean;
    onBuy: () => void;
    isLoading?: boolean;
}

export function PriceCard({
    name,
    credits,
    price,
    description,
    features,
    isPopular = false,
    onBuy,
    isLoading = false
}: PriceCardProps) {
    return (
        <Card className={`relative flex flex-col p-6 h-full transition-all duration-200 hover:shadow-lg ${isPopular ? 'border-primary shadow-md bg-primary/5' : 'border-slate-200 dark:border-border-dark'}`}>
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                </div>
            )}

            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{price}</span>
                    <span className="text-sm text-slate-500 font-medium">/ pack</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">{description}</p>
            </div>

            <div className="flex-1 space-y-3 mb-6">
                <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800/50 rounded lg">
                    <span className="material-symbols-outlined text-primary text-[24px]">token</span>
                    <span className="font-bold text-lg">{credits} Credits</span>
                </div>
                {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="material-symbols-outlined text-emerald-500 text-[18px] shrink-0">check_circle</span>
                        <span>{feature}</span>
                    </div>
                ))}
            </div>

            <Button
                variant={isPopular ? 'primary' : 'outline'}
                className="w-full"
                onClick={onBuy}
                disabled={isLoading}
            >
                {isLoading ? (
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                    'Buy Credits'
                )}
            </Button>
        </Card>
    );
}
