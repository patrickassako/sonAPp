import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
    id: string;
    title: string;
    styleName: string;
    duration?: string;
    createdAt: string;
    status: 'completed' | 'processing' | 'failed';
    audioUrl?: string;
    onPlay?: () => void;
}

export function ProjectCard({
    id,
    title,
    styleName,
    duration,
    createdAt,
    status,
    audioUrl,
    onPlay,
}: ProjectCardProps) {
    const statusConfig = {
        completed: {
            badge: 'bg-emerald-500/10 text-emerald-500',
            icon: 'music_note',
            iconBg: 'bg-primary/10 text-primary',
            label: 'Completed',
            showDot: true,
        },
        processing: {
            badge: 'bg-primary/10 text-primary',
            icon: 'pending',
            iconBg: 'bg-slate-100 dark:bg-border-dark text-slate-400',
            label: 'Processing',
            showDot: false,
        },
        failed: {
            badge: 'bg-red-500/10 text-red-500',
            icon: 'error',
            iconBg: 'bg-red-500/10 text-red-500',
            label: 'Failed',
            showDot: false,
        },
    };

    const config = statusConfig[status];

    return (
        <div className="flex items-center gap-4 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 min-h-[80px] justify-between transition-all hover:border-primary/50 group">
            <div className="flex items-center gap-4 flex-1">
                <div className={cn('flex items-center justify-center rounded-lg shrink-0 size-14', config.iconBg)}>
                    <span className="material-symbols-outlined text-[32px]">{config.icon}</span>
                </div>

                <div className="flex flex-col justify-center min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/projects/${id}`}>
                            <p className="text-slate-900 dark:text-white text-lg font-bold line-clamp-1 hover:text-primary transition-colors">
                                {title}
                            </p>
                        </Link>
                        <span className={cn(
                            'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            config.badge
                        )}>
                            {config.showDot && <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                            {config.label}
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        Style: {styleName} {duration && `• ${duration}`} • {createdAt}
                    </p>
                </div>
            </div>

            <div className="shrink-0">
                {status === 'completed' && audioUrl ? (
                    <button
                        onClick={onPlay}
                        className="flex size-11 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary text-black transition-all hover:scale-110"
                    >
                        <span className="material-symbols-outlined fill-1">play_arrow</span>
                    </button>
                ) : status === 'processing' ? (
                    <div className="text-primary flex size-8 items-center justify-center px-3">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
