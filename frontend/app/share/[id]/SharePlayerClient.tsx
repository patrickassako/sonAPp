"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api/client";
import { Loader2 } from "lucide-react";

interface SharedAudioFile {
    id: string;
    file_url: string | null;
    stream_url: string | null;
    image_url: string | null;
    video_url?: string | null;
    duration: number | null;
    version_number: number;
}

interface SharedProject {
    id: string;
    title: string;
    style_id: string | null;
    custom_style_text: string | null;
    created_at: string;
    audio_files: SharedAudioFile[];
}

export default function SharePlayerClient({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<SharedProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<SharedAudioFile | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const fetchSharedProject = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/share/${projectId}`);
                if (!res.ok) {
                    setError(true);
                    return;
                }
                const data: SharedProject = await res.json();
                setProject(data);
                if (data.audio_files.length > 0) {
                    setSelectedVersion(data.audio_files[0]);
                }
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchSharedProject();
    }, [projectId]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (audioRef.current && duration) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = x / rect.width;
            audioRef.current.currentTime = percent * duration;
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <Loader2 className="w-10 h-10 animate-spin text-[#f49d25]" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#0a0a0a] text-white px-4">
                <span className="material-symbols-outlined text-6xl text-white/20">music_off</span>
                <h1 className="text-2xl font-bold">Track Not Found</h1>
                <p className="text-white/50 text-center">This track may have been removed or doesn&apos;t exist.</p>
                <Link
                    href="/"
                    className="mt-4 px-8 py-3 bg-[#f49d25] text-black font-bold rounded-full hover:scale-105 transition-transform"
                >
                    Create Your Own Music
                </Link>
            </div>
        );
    }

    const coverImage = selectedVersion?.image_url || project.audio_files[0]?.image_url;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <Link href="/" className="flex items-center gap-3 group">
                    <img src="/images/logo-bimzik.png" alt="BimZik" className="h-8 transition-transform group-hover:scale-105" />
                </Link>
                <Link
                    href="/create"
                    className="px-5 py-2 bg-[#f49d25] text-black text-sm font-bold rounded-full hover:scale-105 transition-transform"
                >
                    Create Your Own
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-lg flex flex-col items-center gap-8">
                    {/* Video or Cover Art */}
                    {selectedVersion?.video_url ? (
                        <div className="w-full max-w-[400px] rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                            <video
                                controls
                                className="w-full rounded-2xl bg-black"
                                poster={coverImage || undefined}
                            >
                                <source src={selectedVersion.video_url} type="video/mp4" />
                            </video>
                        </div>
                    ) : (
                        <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                            {coverImage ? (
                                <img
                                    src={coverImage}
                                    alt={project.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#f49d25]/30 to-purple-900/40 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-7xl text-white/20">music_note</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Track Info */}
                    <div className="text-center">
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">{project.title}</h1>
                        <p className="text-white/50 text-sm">
                            {project.style_id && <span className="text-[#f49d25]">#{project.style_id}</span>}
                            {project.style_id && " · "}
                            Created {new Date(project.created_at).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Player */}
                    <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                        {/* Progress Bar */}
                        <div
                            className="w-full h-2 bg-white/10 rounded-full cursor-pointer mb-3 group"
                            onClick={handleSeek}
                        >
                            <div
                                className="h-full bg-[#f49d25] rounded-full relative transition-all"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        {/* Time */}
                        <div className="flex justify-between text-xs text-white/40 mb-6">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={togglePlay}
                                className="w-16 h-16 bg-gradient-to-br from-[#f49d25] to-[#ffc163] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#f49d25]/20 hover:scale-105 transition-transform"
                            >
                                <span className="material-symbols-outlined text-4xl leading-none ml-0.5">
                                    {isPlaying ? "pause" : "play_arrow"}
                                </span>
                            </button>
                        </div>

                        {/* Hidden Audio Element */}
                        {selectedVersion?.file_url && (
                            <audio
                                ref={audioRef}
                                src={selectedVersion.file_url}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onEnded={() => setIsPlaying(false)}
                            />
                        )}
                    </div>

                    {/* Version Selector */}
                    {project.audio_files.length > 1 && (
                        <div className="flex gap-3">
                            {project.audio_files.map((af) => (
                                <button
                                    key={af.id}
                                    onClick={() => {
                                        setSelectedVersion(af);
                                        setIsPlaying(false);
                                        setCurrentTime(0);
                                        setDuration(0);
                                    }}
                                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                                        selectedVersion?.id === af.id
                                            ? "bg-[#f49d25] text-black border-[#f49d25] shadow-lg shadow-orange-500/20"
                                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                                    }`}
                                >
                                    V{af.version_number}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Download Button */}
                    {selectedVersion?.file_url && (
                        <a
                            href={selectedVersion.file_url}
                            download
                            className="flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-white font-semibold hover:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            Download Track
                        </a>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center py-8 border-t border-white/5">
                <p className="text-white/30 text-sm">
                    Made with{" "}
                    <Link href="/" className="text-[#f49d25] hover:underline">
                        BimZik
                    </Link>
                    {" "}- AI Music Generation
                </p>
            </footer>
        </div>
    );
}
