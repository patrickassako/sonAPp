"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/i18n/useTranslation";

export default function SignupPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name }
                }
            });

            if (error) {
                setError(error.message);
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            setError(t("common.error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none" style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(127, 19, 236, 0.1) 0%, rgba(10, 10, 10, 0) 60%)'
            }} />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center mb-8">
                    <img src="/images/logo-bimzik.png" alt="BimZik" className="h-10" />
                </Link>

                {/* Card */}
                <div className="glass-card rounded-2xl p-8">
                    <h1 className="text-2xl font-bold text-white text-center mb-2">
                        {t("signup.title")}
                    </h1>
                    <p className="text-white/60 text-center mb-8">
                        {t("signup.subtitle")} 🌍
                    </p>

                    <form onSubmit={handleSignup} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm text-white/70">{t("signup.nameLabel")}</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t("signup.namePlaceholder")}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-white/70">{t("signup.emailLabel")}</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t("signup.emailPlaceholder")}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-white/70">{t("signup.passwordLabel")}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <p className="text-xs text-white/40">{t("signup.passwordHint")}</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? t("signup.submitting") : t("signup.submit")}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="mt-6 text-center text-white/60">
                        {t("signup.hasAccount")}{" "}
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            {t("signup.loginLink")}
                        </Link>
                    </div>
                </div>

                <p className="text-center text-white/40 text-xs mt-6">
                    {t("signup.terms")}{" "}
                    <Link href="/terms" className="text-primary hover:underline">{t("signup.termsLink")}</Link>
                    {" "}{t("signup.termsAnd")}{" "}
                    <Link href="/privacy" className="text-primary hover:underline">{t("signup.privacyLink")}</Link>.
                </p>
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
