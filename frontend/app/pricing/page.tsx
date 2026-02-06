"use client";

import { useState, useEffect } from "react";
import { Zap, Infinity, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api/client";
import { useTranslation } from "@/i18n/useTranslation";

interface Package {
    id: string;
    name: string;
    credits: number;
    price: number;
    currency: string;
    features: string[];
    is_popular: boolean;
}

export default function PricingPage() {
    const { t } = useTranslation();
    const [packs, setPacks] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/payments/packages`);
            const data = await response.json();
            setPacks(data);
        } catch (error) {
            console.error("Error fetching packages:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/images/logo-bimzik.png" alt="BimZik" className="h-8" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm text-white/70 hover:text-white">{t("pricing.login")}</Link>
                        <Link href="/signup" className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-white/90">
                            {t("pricing.getStarted")}
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="pt-32 pb-16 px-6 max-w-5xl mx-auto">
                {/* Valentine Banner */}
                <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-500/30 text-center">
                    <p className="text-pink-400 font-bold">{t("pricing.valentineBanner")}</p>
                </div>

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4">{t("pricing.title")}</h1>
                    <p className="text-white/60 text-lg max-w-2xl mx-auto">
                        {t("pricing.subtitle")}
                    </p>
                </div>

                {/* Benefits */}
                <div className="flex justify-center gap-8 mb-16">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">{t("pricing.songCost")}</p>
                            <p className="text-xs text-white/40">{t("pricing.songCostSub")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Infinity className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">{t("pricing.noExpiry")}</p>
                            <p className="text-xs text-white/40">{t("pricing.noExpirySub")}</p>
                        </div>
                    </div>
                </div>

                {/* Pricing Cards */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {packs.map((pack) => (
                            <div
                                key={pack.id}
                                className={`relative rounded-2xl p-6 transition-all ${pack.is_popular
                                        ? "bg-gradient-to-b from-primary/20 to-transparent border-2 border-primary scale-105"
                                        : "glass-card"
                                    }`}
                            >
                                {pack.is_popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#FFD700] text-black text-xs font-bold rounded-full">
                                        {t("pricing.bestValue")}
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

                                <Link href="/signup">
                                    <button
                                        className={`w-full py-3 rounded-xl font-bold transition-all ${pack.is_popular
                                                ? "bg-gradient-to-r from-primary to-[#FFD700] text-white"
                                                : "border border-white/10 hover:bg-white/5"
                                            }`}
                                    >
                                        {t("pricing.buyFor", { price: pack.price.toLocaleString(), currency: pack.currency })}
                                    </button>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}

                {/* Mobile Money */}
                <div className="glass-card rounded-2xl p-8 text-center">
                    <div className="inline-flex items-center gap-2 text-[#FFD700] text-sm font-bold mb-4">
                        <Sparkles className="w-4 h-4" />
                        {t("pricing.mobileMoneyTag")}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{t("pricing.mobileMoneyTitle")}</h2>
                    <p className="text-white/60 mb-6">
                        {t("pricing.mobileMoneyDesc")}
                    </p>
                    <Link href="/signup">
                        <button className="bg-gradient-to-r from-pink-500 to-red-500 hover:opacity-90 text-white font-bold px-8 py-3 rounded-xl">
                            {t("pricing.firstSong")}
                        </button>
                    </Link>
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
