'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';

interface AudioPlayerProps {
    url: string;
    title: string;
    duration?: number;
    onPlay?: () => void;
    onPause?: () => void;
    autoPlay?: boolean;
}

export function AudioPlayer({ url, title, duration, onPlay, onPause, autoPlay = false }: AudioPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize WaveSurfer
    useEffect(() => {
        if (!containerRef.current) return;

        let aborted = false;

        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#cbd5e1', // slate-300
            progressColor: '#f59e0b', // amber-500 (primary)
            cursorColor: '#f59e0b',
            barWidth: 2,
            barGap: 3,
            height: 60,
            barRadius: 3,
            normalize: true,
            backend: 'WebAudio',
        });

        wavesurferRef.current = wavesurfer;

        // Load audio
        wavesurfer.load(url);

        // Events
        wavesurfer.on('ready', () => {
            if (aborted) return;
            setIsLoading(false);
            setTotalDuration(wavesurfer.getDuration());
            // Don't autoplay - requires user gesture
        });

        wavesurfer.on('play', () => {
            if (aborted) return;
            setIsPlaying(true);
            onPlay?.();
        });

        wavesurfer.on('pause', () => {
            if (aborted) return;
            setIsPlaying(false);
            onPause?.();
        });

        wavesurfer.on('audioprocess', (time) => {
            if (aborted) return;
            setCurrentTime(time);
        });

        wavesurfer.on('finish', () => {
            if (aborted) return;
            setIsPlaying(false);
        });

        return () => {
            aborted = true;
            wavesurfer.unAll(); // Unsubscribe all events first
            try { wavesurfer.destroy(); } catch { /* Ignore */ }
            wavesurferRef.current = null;
        };
    }, [url]);

    const togglePlay = useCallback(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    }, []);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title}.mp3`; // Assuming mp3 for now
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="p-4 bg-white dark:bg-surface-dark border-slate-200 dark:border-border-dark">
            <div className="flex flex-col gap-4">
                {/* Header info */}
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg truncate max-w-[80%]">{title}</h3>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleDownload}>
                            <span className="material-symbols-outlined text-[20px]">download</span>
                        </Button>
                    </div>
                </div>

                {/* Waveform */}
                <div className="relative w-full">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded">
                            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                        </div>
                    )}
                    <div ref={containerRef} className="w-full" />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="primary"
                            size="md"
                            className="rounded-full size-12 p-0 flex items-center justify-center"
                            onClick={togglePlay}
                            disabled={isLoading}
                        >
                            <span className="material-symbols-outlined text-[28px] pl-1">
                                {isPlaying ? 'pause' : 'play_arrow'}
                            </span>
                        </Button>
                        <span className="text-sm font-mono text-slate-500">
                            {formatTime(currentTime)} / {formatTime(totalDuration || duration || 0)}
                        </span>
                    </div>

                    {/* Volume (Optional, can add later) */}
                </div>
            </div>
        </Card>
    );
}
