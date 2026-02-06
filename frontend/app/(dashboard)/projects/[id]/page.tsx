"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { API_BASE_URL } from "@/lib/api/client";
import { Loader2 } from "lucide-react";

interface Project {
    id: string;
    title: string;
    description: string;
    style_id: string;
    status: string;
    audio_url: string | null;
    image_url: string | null;
    created_at: string;
    lyrics_final?: string; // Updated from lyrics
    lyrics?: string;
}

interface AudioVersion {
    id: string;
    file_url: string | null;
    image_url: string | null;
    video_url?: string | null;
    version_number: number;
    duration: number | null;
}

export default function ProjectResultPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [versions, setVersions] = useState<AudioVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<AudioVersion | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedAudio, setCopiedAudio] = useState(false);
    const [videoGenerating, setVideoGenerating] = useState(false);
    const [videoError, setVideoError] = useState("");
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchProjectData = async () => {
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                // 1. Fetch Project Details
                const projectRes = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });

                if (!projectRes.ok) throw new Error("Failed to fetch project");
                const projectData = await projectRes.json();
                setProject(projectData);

                // 2. Fetch Audio Versions
                const audioRes = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/audio`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });

                if (audioRes.ok) {
                    const audioData = await audioRes.json();
                    setVersions(audioData);
                    if (audioData.length > 0) {
                        setSelectedVersion(audioData[0]);
                    } else if (projectData.audio_url) {
                        setSelectedVersion({
                            id: 'default',
                            file_url: projectData.audio_url,
                            image_url: projectData.image_url,
                            version_number: 1,
                            duration: null
                        });
                    }
                }
            } catch (error: any) {
                if (error.name !== "AbortError") {
                    console.error("Error loading project:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProjectData();

        return () => controller.abort();
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

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Project Not Found</h1>
                <Link href="/dashboard" className="text-primary hover:underline">Return to Dashboard</Link>
            </div>
        );
    }

    return (
        <main className="max-w-[1000px] mx-auto px-6 py-12 animate-fade-in">
            <div className="mb-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                    <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    <span>Retour à la bibliothèque</span>
                </Link>
            </div>

            {/* Header & Metadata */}
            <div className="text-center mb-10">
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase rounded mb-4">
                    Song Style: {project.style_id}
                </span>
                <h1 className="text-slate-900 dark:text-white tracking-tight text-4xl md:text-5xl font-bold leading-tight mb-2">
                    {project.title}
                </h1>
                <p className="text-slate-500 dark:text-[#cbb290] text-base font-normal">
                    Produced by You • Created on {new Date(project.created_at).toLocaleDateString()}
                </p>
            </div>

            {/* Media Player Component */}
            <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-xl p-8 mb-8 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    {/* Cover Art */}
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-48 md:size-64 shadow-lg shrink-0 border border-white/10"
                        style={{ backgroundImage: `url(${selectedVersion?.image_url || project.image_url || "/images/cover-placeholder.png"})`, backgroundColor: '#2a2a2a' }}
                    >
                        {(!project.image_url && !selectedVersion?.image_url) && (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-900/40">
                                <span className="material-symbols-outlined text-6xl text-white/20">music_note</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 w-full flex flex-col justify-center">
                        <div className="mb-6">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{project.title}</h3>
                                    <p className="text-primary font-medium">AI Generated Track</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 dark:text-[#cbb290]">
                                        <span className="material-symbols-outlined">favorite</span>
                                    </button>
                                    {selectedVersion?.file_url && (
                                        <a href={selectedVersion.file_url} download className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 dark:text-[#cbb290]">
                                            <span className="material-symbols-outlined">download</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Waveform Visualization (Visual Mockup) */}
                            <div className="flex items-center gap-1 h-12 mb-2 opacity-80">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1 rounded-full ${i < (currentTime / duration) * 20 ? "bg-primary" : "bg-primary/30"}`}
                                        style={{ height: `${Math.random() * 100}%` }}
                                    ></div>
                                ))}
                            </div>

                            {/* Time */}
                            <div className="flex items-center justify-between text-xs font-medium text-slate-400 dark:text-[#cbb290]">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center md:justify-start gap-6">
                            <button className="text-slate-400 dark:text-[#cbb290] hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-3xl">skip_previous</span>
                            </button>
                            <button
                                onClick={togglePlay}
                                className="size-16 bg-gradient-to-br from-[#f49d25] to-[#ffc163] rounded-full flex items-center justify-center text-background-dark shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                            >
                                <span className="material-symbols-outlined text-4xl leading-none ml-1">
                                    {isPlaying ? "pause" : "play_arrow"}
                                </span>
                            </button>
                            <button className="text-slate-400 dark:text-[#cbb290] hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-3xl">skip_next</span>
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
                </div>
            </div>

            {/* Video Player or Generate Button */}
            {selectedVersion?.video_url ? (
                <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-xl p-8 mb-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="material-symbols-outlined text-primary">videocam</span>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Video Clip</h3>
                    </div>
                    <video
                        controls
                        className="w-full rounded-lg max-h-[500px] bg-black"
                        poster={selectedVersion?.image_url || undefined}
                    >
                        <source src={selectedVersion.video_url} type="video/mp4" />
                    </video>
                    <div className="mt-4 flex justify-end">
                        <a
                            href={selectedVersion.video_url}
                            download
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary/20 text-primary text-sm font-bold rounded-lg hover:bg-primary hover:text-white transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            Download Video
                        </a>
                    </div>
                </div>
            ) : project.status === "completed" && (
                <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-xl p-6 mb-8 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-white/40">videocam</span>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Video Clip</h3>
                                <p className="text-white/40 text-sm">Generate an MP4 video clip from your track</p>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                setVideoGenerating(true);
                                setVideoError("");
                                try {
                                    const supabase = createClient();
                                    const { data: { session } } = await supabase.auth.getSession();
                                    const res = await fetch(`${API_BASE_URL}/api/v1/generate/video/${projectId}`, {
                                        method: "POST",
                                        headers: { Authorization: `Bearer ${session?.access_token}` },
                                    });
                                    if (!res.ok) {
                                        const err = await res.json();
                                        throw new Error(err.detail || "Failed to start video generation");
                                    }
                                    // Poll for video_url by re-fetching audio files periodically
                                    const pollVideo = async () => {
                                        for (let i = 0; i < 30; i++) {
                                            await new Promise(r => setTimeout(r, 6000));
                                            const { data: { session: s } } = await supabase.auth.getSession();
                                            const audioRes = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/audio`, {
                                                headers: { Authorization: `Bearer ${s?.access_token}` },
                                            });
                                            if (audioRes.ok) {
                                                const audioData = await audioRes.json();
                                                const withVideo = audioData.find((a: AudioVersion) => a.video_url);
                                                if (withVideo) {
                                                    setVersions(audioData);
                                                    setSelectedVersion(audioData.find((a: AudioVersion) => a.id === selectedVersion?.id) || audioData[0]);
                                                    setVideoGenerating(false);
                                                    return;
                                                }
                                            }
                                        }
                                        setVideoError("Video generation timed out. Refresh the page to check.");
                                        setVideoGenerating(false);
                                    };
                                    pollVideo();
                                } catch (error: any) {
                                    setVideoError(error.message);
                                    setVideoGenerating(false);
                                }
                            }}
                            disabled={videoGenerating}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {videoGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[20px]">movie</span>
                                    Generate Clip
                                </>
                            )}
                        </button>
                    </div>
                    {videoError && (
                        <p className="text-red-400 text-sm mt-3">{videoError}</p>
                    )}
                </div>
            )}

            {/* Versions Selector */}
            {versions.length > 0 && (
                <div className="flex justify-center gap-4 mb-12">
                    {versions.map((v) => (
                        <button
                            key={v.id}
                            onClick={() => { setSelectedVersion(v); setIsPlaying(false); }}
                            className={`px-8 py-3 rounded-xl font-bold transition-all border border-white/10 ${selectedVersion?.id === v.id ? "bg-[#f49d25] text-white shadow-lg shadow-orange-500/20" : "bg-white/5 hover:bg-white/10 text-white/60"}`}
                        >
                            VERSION {v.version_number}
                        </button>
                    ))}
                </div>
            )}

            {/* Share Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="flex flex-col gap-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white px-1">Share your masterpiece</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => {
                                const shareUrl = `${window.location.origin}/share/${project.id}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(`Check out my track "${project.title}"! ${shareUrl}`)}`, "_blank");
                            }}
                            className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-white/5 rounded-xl hover:bg-primary/5 transition-all group"
                        >
                            <div className="size-12 bg-[#25D366]/20 rounded-full flex items-center justify-center text-[#25D366] group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined">chat_bubble</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-[#cbb290] uppercase tracking-tighter">WhatsApp</span>
                        </button>
                        <button
                            onClick={() => {
                                const shareUrl = `${window.location.origin}/share/${project.id}`;
                                navigator.clipboard.writeText(shareUrl);
                                alert("Link copied! Paste it in your Instagram story.");
                            }}
                            className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-white/5 rounded-xl hover:bg-primary/5 transition-all group"
                        >
                            <div className="size-12 bg-[#E4405F]/20 rounded-full flex items-center justify-center text-[#E4405F] group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined">photo_camera</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-[#cbb290] uppercase tracking-tighter">Stories</span>
                        </button>
                        <button
                            onClick={() => {
                                const shareUrl = `${window.location.origin}/share/${project.id}`;
                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank", "width=600,height=400");
                            }}
                            className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-white/5 rounded-xl hover:bg-primary/5 transition-all group"
                        >
                            <div className="size-12 bg-[#1877F2]/20 rounded-full flex items-center justify-center text-[#1877F2] group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined">social_leaderboard</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-[#cbb290] uppercase tracking-tighter">Feed</span>
                        </button>
                    </div>

                    {/* Copy Link */}
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <span className="material-symbols-outlined text-primary">link</span>
                            <span className="text-sm text-slate-400 truncate">{typeof window !== "undefined" ? window.location.origin : ""}/share/{project.id.substring(0, 8)}</span>
                        </div>
                        <button
                            onClick={() => {
                                const shareUrl = `${window.location.origin}/share/${project.id}`;
                                navigator.clipboard.writeText(shareUrl);
                                setCopiedLink(true);
                                setTimeout(() => setCopiedLink(false), 2000);
                            }}
                            className="px-4 py-2 bg-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-all min-w-[70px]"
                        >
                            {copiedLink ? "COPIED!" : "COPY"}
                        </button>
                    </div>

                    {/* Copy Audio Link */}
                    {selectedVersion?.file_url && (
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className="material-symbols-outlined text-primary">audio_file</span>
                                <span className="text-sm text-slate-400 truncate">Direct audio link</span>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(selectedVersion.file_url!);
                                    setCopiedAudio(true);
                                    setTimeout(() => setCopiedAudio(false), 2000);
                                }}
                                className="px-4 py-2 bg-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-all min-w-[70px]"
                            >
                                {copiedAudio ? "COPIED!" : "COPY"}
                            </button>
                        </div>
                    )}
                </div>

                {/* How It Was Made Card */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-8 flex flex-col gap-6">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                        <span className="material-symbols-outlined text-primary">auto_awesome</span>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">How it was made</h3>
                    </div>
                    <div className="flex flex-col gap-4">
                        {(project.lyrics_final || project.lyrics) && (
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-[#cbb290] uppercase tracking-widest mb-2">Lyrics Snippet</p>
                                <div className="p-4 bg-black/20 rounded-lg border border-white/5 max-h-32 overflow-y-auto">
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 italic whitespace-pre-line">
                                        "{(project.lyrics_final || project.lyrics || "").split('\n').slice(0, 4).join('\n')}..."
                                    </p>
                                </div>
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-[#cbb290] uppercase tracking-widest mb-2">Style Tags</p>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-white/5 text-xs text-slate-400 dark:text-[#cbb290] border border-white/10 rounded-full">#{project.style_id}</span>
                                <span className="px-3 py-1 bg-white/5 text-xs text-slate-400 dark:text-[#cbb290] border border-white/10 rounded-full">#AI</span>
                                <span className="px-3 py-1 bg-white/5 text-xs text-slate-400 dark:text-[#cbb290] border border-white/10 rounded-full">#Music</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer CTA */}
            <div className="flex justify-center">
                <Link href="/create">
                    <button className="bg-gradient-to-br from-[#f49d25] to-[#ffc163] text-background-dark font-bold text-lg px-12 py-5 rounded-full shadow-2xl shadow-primary/30 flex items-center gap-3 hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined font-bold">add_circle</span>
                        CREATE ANOTHER TRACK
                    </button>
                </Link>
            </div>
        </main>
    );
}
