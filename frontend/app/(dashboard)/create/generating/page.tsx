"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, Music, Download, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function GeneratingPage() {
    const searchParams = useSearchParams();
    const jobId = searchParams.get("job");

    const [status, setStatus] = useState<"generating" | "completed" | "failed">("generating");
    const [progress, setProgress] = useState(0);
    const [audioUrl, setAudioUrl] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!jobId) return;

        const checkStatus = async () => {
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();

                const response = await fetch(`http://localhost:8000/api/v1/generate/jobs/${jobId}`, {
                    headers: {
                        Authorization: `Bearer ${session?.access_token}`
                    }
                });

                const data = await response.json();

                if (data.status === "completed") {
                    setStatus("completed");
                    setProgress(100);
                    // Redirect to result page
                    setTimeout(() => {
                        window.location.href = `/projects/${data.project_id}`;
                    }, 1000);
                } else if (data.status === "failed") {
                    setStatus("failed");
                    setError(data.error || "La génération a échoué");
                } else {
                    // Still processing
                    // Update progress more realistically based on time or API status
                    setProgress((prev) => {
                        if (prev >= 90) return 90;
                        return prev + 5;
                    });
                }
            } catch (error) {
                console.error("Error checking status:", error);
            }
        };

        const interval = setInterval(checkStatus, 3000);
        checkStatus();

        return () => clearInterval(interval);
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
                            {status === "completed" ? "Terminé !" : "Création en cours..."}
                        </h1>
                        <p className="text-white/60 mb-8">
                            {status === "completed"
                                ? "Redirection vers votre chanson..."
                                : "Notre IA compose votre chanson africaine. Cela peut prendre 1-2 minutes."}
                        </p>

                        <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${status === "completed" ? "bg-green-500" : "bg-primary"}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-sm text-white/40">{progress}%</p>
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
