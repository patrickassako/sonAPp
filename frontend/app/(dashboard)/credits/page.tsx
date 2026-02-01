"use client";

import { useState, useEffect } from "react";
import { Zap, Infinity, Check, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Package {
    id: string;
    name: string;
    credits: number;
    price: number;
    currency: string;
    features: string[];
    is_popular: boolean;
}

export default function CreditsPage() {
    const [packs, setPacks] = useState<Package[]>([]);
    const [selectedPack, setSelectedPack] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/v1/payments/packages");
            const data = await response.json();
            setPacks(data);
            // Auto-select popular pack or first one
            const popular = data.find((p: Package) => p.is_popular);
            setSelectedPack(popular?.id || data[0]?.id);
        } catch (error) {
            console.error("Error fetching packages:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!selectedPack) return;

        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch("http://localhost:8000/api/v1/payments/initiate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    package_id: selectedPack,
                    phone_number: phoneNumber
                })
            });

            const data = await response.json();
            if (data.payment_link) {
                window.location.href = data.payment_link;
            }
        } catch (error) {
            console.error("Error purchasing:", error);
            alert("Erreur lors de l'achat. Veuillez réessayer.");
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Fuel Your Creativity</h1>
                <p className="text-white/60 text-lg">
                    Simple, transparent pricing for African creators. Buy once, use anytime with localized payment methods.
                </p>
            </div>

            {/* Benefits */}
            <div className="flex justify-center gap-8 mb-12">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">1 Song = 5 Credits</p>
                        <p className="text-xs text-white/40">Predictable cost for every creation</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Infinity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">No Expiry</p>
                        <p className="text-xs text-white/40">Your credits stay with you forever</p>
                    </div>
                </div>
            </div>

            {/* Pricing Cards */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
            ) : packs.length === 0 ? (
                <div className="text-center py-12 text-white/60">
                    Aucun package disponible pour le moment
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {packs.map((pack) => (
                        <div
                            key={pack.id}
                            onClick={() => setSelectedPack(pack.id)}
                            className={`relative rounded-2xl p-6 cursor-pointer transition-all ${pack.is_popular
                                    ? "bg-gradient-to-b from-primary/20 to-transparent border-2 border-primary scale-105"
                                    : selectedPack === pack.id
                                        ? "glass-card border-2 border-primary/50"
                                        : "glass-card hover:border-white/20"
                                }`}
                        >
                            {pack.is_popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#FFD700] text-black text-xs font-bold rounded-full">
                                    BEST VALUE
                                </div>
                            )}

                            <h3 className="text-lg font-bold mb-4">{pack.name}</h3>

                            <div className="mb-6">
                                <span className="text-4xl font-bold">{pack.credits}</span>
                                <span className="text-white/60 ml-2">Credits</span>
                            </div>

                            <ul className="space-y-2 mb-6">
                                {pack.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                                        <Check className="w-4 h-4 text-green-400" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPack(pack.id);
                                }}
                                className={`w-full py-3 rounded-xl font-bold transition-all ${pack.is_popular
                                        ? "bg-gradient-to-r from-primary to-[#FFD700] text-white"
                                        : "border border-white/10 hover:bg-white/5 text-white"
                                    }`}
                            >
                                Acheter pour {pack.price.toLocaleString()} {pack.currency}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Mobile Money Section */}
            <div className="glass-card rounded-2xl p-8">
                <div className="flex items-center gap-2 text-[#FFD700] text-sm font-bold mb-4">
                    <Sparkles className="w-4 h-4" />
                    INSTANT CREDIT DELIVERY
                </div>

                <h2 className="text-2xl font-bold mb-2">Localized Mobile Money</h2>
                <p className="text-white/60 mb-6">
                    Pay securely using your preferred local method. No credit card required. Credits are added to your account immediately after payment confirmation.
                </p>

                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex gap-2">
                        {["M-PESA", "MTN", "Airtel", "OM"].map((provider) => (
                            <button
                                key={provider}
                                className="px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition-colors"
                            >
                                {provider}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 flex gap-2">
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="Enter phone number"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                            onClick={handlePurchase}
                            disabled={!selectedPack || !phoneNumber}
                            className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            QUICK PAY
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .glass-card {
          background: rgba(26, 17, 34, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
        </div>
    );
}
