"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Bell, Globe, Lock, Save, LogOut, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const [settings, setSettings] = useState({
        fullName: "",
        email: "",
        language: "fr",
        emailNotifications: true,
        pushNotifications: false
    });

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUser(user);
                setSettings(prev => ({
                    ...prev,
                    email: user.email || "",
                    fullName: user.user_metadata?.full_name || ""
                }));
            }
        });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            await supabase.auth.updateUser({
                data: { full_name: settings.fullName }
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Retour</span>
                </Link>
            </div>
            <h1 className="text-3xl font-bold mb-8">Paramètres</h1>

            {/* Profile Section */}
            <div className="glass-card rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <User className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Profil</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-white/70 mb-2 block">Nom complet</label>
                        <input
                            type="text"
                            value={settings.fullName}
                            onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-white/70 mb-2 block">Email</label>
                        <input
                            type="email"
                            value={settings.email}
                            disabled
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed"
                        />
                        <p className="text-xs text-white/40 mt-1">L&apos;email ne peut pas être modifié</p>
                    </div>
                </div>
            </div>

            {/* Language Section */}
            <div className="glass-card rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <Globe className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Langue</h2>
                </div>

                <div className="flex gap-3">
                    {[
                        { code: "fr", label: "Français" },
                        { code: "en", label: "English" }
                    ].map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => setSettings({ ...settings, language: lang.code })}
                            className={`px-4 py-2 rounded-xl transition-all ${settings.language === lang.code
                                ? "bg-primary text-white"
                                : "bg-white/5 text-white/60 hover:bg-white/10"
                                }`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications Section */}
            <div className="glass-card rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <Bell className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Notifications</h2>
                </div>

                <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-white/80">Notifications par email</span>
                        <input
                            type="checkbox"
                            checked={settings.emailNotifications}
                            onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                            className="w-5 h-5 accent-primary"
                        />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-white/80">Notifications push</span>
                        <input
                            type="checkbox"
                            checked={settings.pushNotifications}
                            onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                            className="w-5 h-5 accent-primary"
                        />
                    </label>
                </div>
            </div>

            {/* Security Section */}
            <div className="glass-card rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <Lock className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">Sécurité</h2>
                </div>

                <button className="text-primary hover:underline text-sm">
                    Changer le mot de passe →
                </button>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {saved ? (
                    <>✓ Sauvegardé</>
                ) : loading ? (
                    <>Sauvegarde...</>
                ) : (
                    <>
                        <Save className="w-5 h-5" />
                        Sauvegarder
                    </>
                )}
            </button>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="w-full mt-8 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 border border-red-500/20 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                Déconnexion
            </button>

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
