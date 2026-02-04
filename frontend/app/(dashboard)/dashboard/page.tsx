"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { API_BASE_URL } from "@/lib/api/client";

interface Project {
    id: string;
    title: string;
    style_id: string;
    status: string;
    created_at: string;
    audio_url?: string;
    description?: string;
}

export default function DashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        const fetchProjects = async () => {
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    const response = await fetch(`${API_BASE_URL}/api/v1/projects/`, {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                        signal: controller.signal,
                    });
                    const data = await response.json();
                    // Handle both array and object responses
                    const projectList = Array.isArray(data) ? data : (Array.isArray(data.projects) ? data.projects : []);
                    setProjects(projectList);
                }
            } catch (error: any) {
                if (error.name !== "AbortError") {
                    console.error("Error fetching projects:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();

        return () => controller.abort();
    }, []);

    const getStatusBadge = (status: string) => {
        if (status === "completed") {
            return (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Completed
                </span>
            );
        }
        if (status === "generating" || status === "processing") {
            return (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[10px] animate-spin">progress_activity</span>
                    Processing
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                Draft
            </span>
        );
    };

    const getIcon = (status: string) => {
        if (status === "generating") return "pending";
        if (status === "completed") return "graphic_eq";
        return "music_note";
    };

    return (
        <>
            {/* Hero Generation Card */}
            <div className="@container">
                <div className="flex flex-col items-stretch justify-start rounded-xl overflow-hidden shadow-2xl relative min-h-[220px]" style={{ background: "linear-gradient(135deg, #6d28d9 0%, #f4c025 100%)" }}>
                    {/* Decorative background pattern */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" }}></div>

                    <div className="flex flex-col md:flex-row h-full relative z-10">
                        <div className="flex w-full grow flex-col items-start justify-center gap-4 p-8 md:p-12">
                            <h1 className="text-white text-3xl md:text-4xl font-bold font-display leading-tight tracking-tight">Ready to make some noise?</h1>
                            <p className="text-white/90 text-lg font-medium max-w-md">Transform your ideas into professional tracks using AI-powered generation in seconds.</p>

                            <Link href="/create">
                                <button className="mt-4 flex min-w-[160px] items-center justify-center gap-2 overflow-hidden rounded-full h-12 px-6 bg-white text-slate-900 text-base font-bold transition-all hover:bg-slate-100 shadow-lg hover:shadow-white/20">
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                    <span>Start Generation</span>
                                </button>
                            </Link>
                        </div>

                        {/* Abstract Image Right (Optional) */}
                        <div className="hidden md:block w-1/3 bg-center bg-no-repeat bg-cover opacity-80 mix-blend-soft-light"
                            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1514525253440-b393452e3383?q=80&w=2000&auto=format&fit=crop")' }}>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Projects Section */}
            <section>
                <div className="flex items-center justify-between px-2 pb-6">
                    <h2 className="text-white text-2xl font-bold font-display leading-tight tracking-tight">Recent Projects</h2>
                    <button className="text-primary text-sm font-bold hover:underline">View All</button>
                </div>

                <div className="flex flex-col gap-3">
                    {loading ? (
                        <div className="text-center py-10 opacity-50">
                            <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-12 bg-[#1e1e1e] rounded-xl border border-[#2e2e2e]">
                            <span className="material-symbols-outlined text-4xl text-white/20 mb-2">music_off</span>
                            <p className="text-white/60">No projects yet. Start your first generation!</p>
                        </div>
                    ) : (
                        projects.map((project) => (
                            <Link
                                key={project.id}
                                href={project.status === 'generating' || project.status === 'processing'
                                    ? `/create/generating?job=${project.id}`
                                    : `/projects/${project.id}`}
                                className="block"
                            >
                                <div className="flex items-center gap-4 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl px-4 py-3 min-h-[80px] justify-between transition-all hover:border-primary/50 group">
                                    <div className="flex items-center gap-4">
                                        <div className={`text-${project.status === 'generating' ? 'slate-400' : 'primary'} flex items-center justify-center rounded-lg bg-${project.status === 'generating' ? 'slate-100 dark:bg-[#2e2e2e]' : 'primary/10'} shrink-0 size-14`}>
                                            <span className="material-symbols-outlined text-[32px]">{getIcon(project.status)}</span>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <div className="flex items-center gap-2">
                                                <p className="text-white text-lg font-bold font-display line-clamp-1">{project.title}</p>
                                                {getStatusBadge(project.status)}
                                            </div>
                                            <p className="text-slate-400 text-sm font-medium">
                                                Style: {project.style_id} • Created {new Date(project.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {project.status === 'generating' || project.status === 'processing' ? (
                                            <div className="text-primary flex size-8 items-center justify-center">
                                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                            </div>
                                        ) : (
                                            <button className="flex size-11 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary text-black transition-all hover:scale-110">
                                                <span className="material-symbols-outlined fill-1">play_arrow</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </section>
        </>
    );
}
