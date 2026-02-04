"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { API_BASE_URL } from "@/lib/api/client";

export default function PaymentProcessedPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <PaymentProcessedContent />
        </Suspense>
    );
}

function PaymentProcessedContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [message, setMessage] = useState("We are verifying your payment with the provider...");

    // Get params from Flutterwave redirect
    // URL format: ?status=successful&tx_ref=...&transaction_id=...
    const tx_ref = searchParams.get("tx_ref");
    const transaction_id = searchParams.get("transaction_id");
    const fw_status = searchParams.get("status");

    useEffect(() => {
        if (!tx_ref) {
            setStatus("error");
            setMessage("Invalid transaction reference.");
            return;
        }

        if (fw_status === "cancelled") {
            setStatus("error");
            setMessage("Payment was cancelled.");
            return;
        }

        const verifyPayment = async () => {
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    throw new Error("User session not found");
                }

                let verifyUrl = `${API_BASE_URL}/api/v1/payments/verify/${tx_ref}`;
                if (transaction_id) {
                    verifyUrl += `?transaction_id=${transaction_id}`;
                }

                const response = await fetch(verifyUrl, {
                    headers: {
                        "Authorization": `Bearer ${session.access_token}`,
                    },
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    setStatus("success");
                    setMessage("Payment verified! Your credits have been added.");
                    setTimeout(() => router.push("/credits"), 3000);
                } else {
                    throw new Error(data.detail || "Verification failed");
                }
            } catch (error: any) {
                console.error(error);
                setStatus("error");
                setMessage(error.message || "Payment verification failed. Please contact support.");
            }
        };

        verifyPayment();
    }, [tx_ref, fw_status, router]);

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center">
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
                {status === "verifying" && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                        <h1 className="text-2xl font-bold">Verifying Payment</h1>
                        <p className="text-white/60">{message}</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4">
                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                        <h1 className="text-2xl font-bold text-green-500">Success!</h1>
                        <p className="text-white/60">{message}</p>
                        <p className="text-sm text-white/40 mt-4">Redirecting back to credits...</p>
                        <Link href="/credits" className="mt-4 px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-all font-medium">
                            Return now
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4">
                        <XCircle className="w-16 h-16 text-red-500" />
                        <h1 className="text-2xl font-bold text-red-500">Payment Failed</h1>
                        <p className="text-white/60">{message}</p>
                        <Link href="/credits" className="mt-6 flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full hover:bg-white/20 transition-all font-medium">
                            <ArrowLeft className="w-4 h-4" />
                            Return to Credits
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
