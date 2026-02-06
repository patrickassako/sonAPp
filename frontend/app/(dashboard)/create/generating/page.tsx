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

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function NotificationOptIn({ jobId }: { jobId: string }) {
    const [destination, setDestination] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [subscribedChannel, setSubscribedChannel] = useState<"push" | "email">("push");
    const [error, setError] = useState("");
    const [pushSupported, setPushSupported] = useState(true);
    const [pushDenied, setPushDenied] = useState(false);

    useEffect(() => {
        const supported = "serviceWorker" in navigator && "PushManager" in window;
        setPushSupported(supported);
        if (supported && Notification.permission === "denied") {
            setPushDenied(true);
        }
    }, []);

    const sendSubscription = async (channel: string, dest: string) => {
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
                channel,
                destination: dest,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "Erreur lors de l'inscription");
        }
    };

    const handlePushSubscribe = async () => {
        setError("");
        setSubmitting(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setPushDenied(true);
                setSubmitting(false);
                return;
            }

            // Get VAPID key from backend
            const vapidRes = await fetch(`${API_BASE_URL}/api/v1/notifications/vapid-key`);
            const vapidData = await vapidRes.json();
            if (!vapidRes.ok) {
                throw new Error("Push non configuré sur le serveur");
            }

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidData.vapid_public_key),
            });

            await sendSubscription("push", JSON.stringify(subscription.toJSON()));
            setSubscribedChannel("push");
            setSubscribed(true);
        } catch (err: any) {
            setError(err.message || "Erreur lors de l'activation");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEmailSubscribe = async () => {
        setError("");
        if (!destination.trim()) {
            setError("Entrez votre email");
            return;
        }

        setSubmitting(true);
        try {
            await sendSubscription("email", destination.trim());
            setSubscribedChannel("email");
            setSubscribed(true);
        } catch (err: any) {
            setError(err.message || "Erreur réseau");
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
                        {subscribedChannel === "push"
                            ? "Notifications push activées"
                            : `Vous serez notifié par email (${destination})`}
                    </span>
                </div>
            </div>
        );
    }

    const showEmailFallback = !pushSupported || pushDenied;

    return (
        <div className="mt-8 p-5 rounded-xl bg-white/5 border border-white/10">
            {!showEmailFallback ? (
                <>
                    <p className="text-sm text-white/70 mb-4 flex items-center gap-2 justify-center">
                        <Bell className="w-4 h-4" />
                        Recevez une notification quand votre track est prête :
                    </p>
                    <button
                        onClick={handlePushSubscribe}
                        disabled={submitting}
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>
                                <Bell className="w-4 h-4" />
                                Activer les notifications
                            </>
                        )}
                    </button>
                </>
            ) : (
                <>
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
                            onClick={handleEmailSubscribe}
                            disabled={submitting}
                            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Activer"}
                        </button>
                    </div>
                </>
            )}

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
    const [projectId, setProjectId] = useState<string | null>(null);

    useEffect(() => {
        if (!jobId) return;

        let attempts = 0;
        const maxAttempts = 80;
        let delay = 3000;
        let consecutiveErrors = 0;
        let timeoutId: NodeJS.Timeout;
        const controller = new AbortController();

        const getToken = async () => {
            const supabase = createClient();
            // Refresh session if needed (prevents expired token issues)
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Try refreshing
                const { data } = await supabase.auth.refreshSession();
                return data.session?.access_token;
            }
            return session.access_token;
        };

        const checkStatus = async () => {
            attempts++;
            if (attempts > maxAttempts) {
                setStatus("failed");
                setError("La génération a pris trop de temps. Vérifiez votre projet, la musique a peut-être été générée.");
                return;
            }

            try {
                const token = await getToken();
                if (!token) {
                    setStatus("failed");
                    setError("Session expirée. Reconnectez-vous et vérifiez vos projets.");
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/v1/generate/jobs/${jobId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });

                // Handle HTTP errors explicitly
                if (!response.ok) {
                    consecutiveErrors++;
                    console.warn(`Poll error ${response.status} (attempt ${consecutiveErrors})`);
                    // After 5 consecutive errors, show failure
                    if (consecutiveErrors >= 5) {
                        setStatus("failed");
                        setError("Impossible de vérifier le statut. Vérifiez votre projet.");
                        return;
                    }
                    // Otherwise retry
                    delay = Math.min(delay * 1.15, 8000);
                    timeoutId = setTimeout(checkStatus, delay);
                    return;
                }

                // Reset consecutive error count on success
                consecutiveErrors = 0;
                const data = await response.json();

                // Store project_id for fallback navigation
                if (data.project_id && !projectId) {
                    setProjectId(data.project_id);
                }

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
                consecutiveErrors++;
                console.error("Error checking status:", error);
                if (consecutiveErrors >= 5) {
                    setStatus("failed");
                    setError("Erreur réseau. Vérifiez votre connexion et consultez vos projets.");
                    return;
                }
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

                        <div className="flex flex-col gap-3 items-center">
                            {projectId && (
                                <Link href={`/projects/${projectId}`}>
                                    <button className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl">
                                        Voir mon projet
                                    </button>
                                </Link>
                            )}
                            <div className="flex gap-4">
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
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
