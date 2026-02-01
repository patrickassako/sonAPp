"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/atoms/Button";

interface LandingWaveformPlayerProps {
    previewUrl: string | null;
    heights?: number[];
}

export function LandingWaveformPlayer({ previewUrl, heights }: LandingWaveformPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Use provided heights or default to equal
    const bars = heights || Array.from({ length: 30 }, () => 30);

    useEffect(() => {
        if (!audioRef.current && previewUrl) {
            audioRef.current = new Audio(previewUrl);
            audioRef.current.onended = () => setIsPlaying(false);
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        }
    }, [previewUrl]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            // Pause all other audios if any (simple implementation)
            document.querySelectorAll('audio').forEach(el => el.pause());
            audioRef.current.play().catch(e => console.error("Playback error:", e));
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Visualizer & Play Button Container */}
            <div className="h-16 bg-slate-900 rounded-lg flex items-center justify-between gap-3 px-4 relative group">

                {/* Render Bars */}
                <div className="flex items-center gap-1 flex-1 justify-center h-full">
                    {bars.map((h, i) => (
                        <div
                            key={i}
                            className={`w-1 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse bg-primary' : 'bg-primary/40'}`}
                            style={{
                                height: isPlaying ? `${Math.max(20, Math.random() * 100)}%` : `${h}%`,
                                minHeight: '10%'
                            }}
                        />
                    ))}
                </div>

                {/* Play Overlay Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg backdrop-blur-[1px]">
                    <Button
                        onClick={togglePlay}
                        size="sm"
                        className="rounded-full w-12 h-12 bg-primary text-black hover:scale-110 transition-transform shadow-xl"
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {isPlaying ? "pause" : "play_arrow"}
                        </span>
                    </Button>
                </div>
            </div>

            {/* Mobile/Always visible play button for better UX if needed, but overlay is cleaner */}
        </div>
    );
}
