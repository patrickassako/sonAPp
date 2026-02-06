"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, Music, Mail, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { API_BASE_URL } from "@/lib/api/client";

export default function GeneratingPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[80vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <GeneratingContent />
        </Suspense>
    );
}

function NotificationOptIn({ jobId }: { jobId: string }) {
    const [destination, setDestination] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [error, setError] = useState("");

    const handleSubscribe = async () => {
        setError("");
        if (!destination.trim()) {
            setError("Entrez votre email");
            return;
        }

        setSubmitting(true);
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch(`${API_BASE_URL}/api/v1/notifications/subscribe`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    job_id: jobId,
                    destination: destination.trim(),
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                setError(data.detail || "Erreur lors de l'inscription");
                return;
            }

            setSubscribed(true);
        } catch {
            setError("Erreur réseau");
        } finally {
            setSubmitting(false);
        }
    };

    if (subscribed) {
        return (
            <div className="mt-8 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 justify-center text-green-400">
                    <Bell className="w-4 h-4" />
                    <span className="text-sm font-medium">
                        Vous serez notifié par email ({destination})
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8 p-5 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/70 mb-4 flex items-center gap-2 justify-center">
                <Mail className="w-4 h-4" />
                Recevez un lien vers votre track par email :
            </p>

            <div className="flex gap-2">
                <input
                    type="email"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="votre@email.com"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary"
                />
                <button
                    onClick={handleSubscribe}
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Activer"}
                </button>
            </div>

            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
    );
}

function GeneratingContent() {
    const searchParams = useSearchParams();
    const jobId = searchParams.get("job");

    const [status, setStatus] = useState<"generating" | "completed" | "failed">("generating");
    const [progress, setProgress] = useState(0);
    const [audioUrl, setAudioUrl] = useState("");
    const [error, setError] = useState("");
    const [videoPhase, setVideoPhase] = useState(false);

    useEffect(() => {
        if (!jobId) return;

        let attempts = 0;
        const maxAttempts = 80;
        let delay = 3000;
        let timeoutId: NodeJS.Timeout;
        const controller = new AbortController();

        const checkStatus = async () => {
            attempts++;
            if (attempts > maxAttempts) {
                setStatus("failed");
                setError("La génération a pris trop de temps. Veuillez réessayer.");
                return;
            }

            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();

                const response = await fetch(`${API_BASE_URL}/api/v1/generate/jobs/${jobId}`, {
                    headers: {
                        Authorization: `Bearer ${session?.access_token}`
                    },
                    signal: controller.signal,
                });

                const data = await response.json();

                if (data.status === "completed") {
                    const vs = data.video_status;
                    // If video is still processing, keep polling
                    if (vs === "processing") {
                        setVideoPhase(true);
                        setProgress(92);
                    } else {
                        // No video, or video completed/failed -> redirect
                        setStatus("completed");
                        setProgress(100);
                        setTimeout(() => {
                            window.location.href = `/projects/${data.project_id}`;
                        }, 1000);
                        return;
                    }
                } else if (data.status === "failed") {
                    setStatus("failed");
                    setError(data.error || "La génération a échoué");
                    return;
                } else {
                    setProgress((prev) => {
                        if (prev >= 90) return 90;
                        return prev + 3;
                    });
                }
            } catch (error: any) {
                if (error.name === "AbortError") return;
                console.error("Error checking status:", error);
            }

            delay = Math.min(delay * 1.15, 8000);
            timeoutId = setTimeout(checkStatus, delay);
        };

        checkStatus();

        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [jobId]);

    return (
        <div className="flex items-center justify-center min-h-[80vh] p-8">
            <div className="text-center max-w-md">
                {(status === "generating" || status === "completed") && (
                    <>
                        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8 relative">
                            {status === "completed" ? (
                                <CheckCircle className="w-16 h-16 text-green-500" />
                            ) : (
                                <>
                                    <Music className="w-16 h-16 text-primary animate-pulse" />
                                    <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                                </>
                            )}
                        </div>

                        <h1 className="text-2xl font-bold mb-4">
                            {status === "completed" ? "Terminé !" : videoPhase ? "Création du clip vidéo..." : "Création en cours..."}
                        </h1>
                        <p className="text-white/60 mb-8">
                            {status === "completed"
                                ? "Redirection vers votre chanson..."
                                : videoPhase
                                    ? "L'audio est prêt ! Génération du clip vidéo en cours..."
                                    : "Notre IA compose votre chanson africaine. Cela peut prendre 1-2 minutes."}
                        </p>

                        <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${status === "completed" ? "bg-green-500" : "bg-primary"}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-sm text-white/40">{progress}%</p>

                        {/* Notification opt-in (only while generating) */}
                        {status === "generating" && jobId && (
                            <NotificationOptIn jobId={jobId} />
                        )}
                    </>
                )}

                {status === "failed" && (
                    <>
                        <div className="w-32 h-32 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-8">
                            <XCircle className="w-16 h-16 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold mb-4">Échec de la génération</h1>
                        <p className="text-white/60 mb-8">{error}</p>

                        <div className="flex gap-4 justify-center">
                            <Link href="/create">
                                <button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl">
                                    Réessayer
                                </button>
                            </Link>
                            <Link href="/dashboard">
                                <button className="border border-white/10 hover:bg-white/5 text-white font-bold px-6 py-3 rounded-xl">
                                    Dashboard
                                </button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
