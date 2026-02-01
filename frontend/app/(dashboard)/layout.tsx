"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Music2, Plus, LogOut, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useWallet } from "@/lib/hooks/useWallet";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const { credits } = useWallet();

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                router.push("/login");
            } else {
                setUser(user);
            }
        });
    }, [router]);

    return (
        <div className="flex flex-col min-h-screen bg-[#121212] text-white selection:bg-primary/30 font-sans">
            {/* Top Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-[#121212] border-b border-[#2e2e2e]">
                <Link href="/dashboard" className="flex items-center gap-4 group">
                    <div className="text-primary transition-transform group-hover:scale-110">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                        </svg>
                    </div>
                    <span className="text-xl font-bold font-display tracking-tight">MusicApp</span>
                </Link>

                <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-3">
                        {/* Credit Balance Pill */}
                        <Link href="/credits" className="hidden sm:flex items-center gap-2 h-10 px-4 rounded-full bg-[#1e1e1e] border border-[#2e2e2e] hover:bg-[#2a2a2a] transition-colors">
                            <span className="material-symbols-outlined text-primary text-[20px]">toll</span>
                            <span className="text-sm font-semibold">{credits} Credits</span>
                        </Link>

                        {/* Buy Credits Button */}
                        <Link href="/credits">
                            <button className="flex min-w-[100px] items-center justify-center rounded-lg h-10 px-5 bg-primary text-black text-sm font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                                Buy Credits
                            </button>
                        </Link>
                    </div>

                    {/* User Avatar */}
                    <Link href="/settings" className="relative group">
                        <div className="w-10 h-10 rounded-full bg-[#1e1e1e] border-2 border-primary/20 flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors">
                            <UserIcon className="w-5 h-5 text-white/60 group-hover:text-white" />
                        </div>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex justify-center py-8 px-4 md:px-10">
                <div className="w-full max-w-[1000px] flex flex-col gap-8">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-[#121212]/90 backdrop-blur-md border-t border-[#2e2e2e] flex justify-around items-center z-50">
                <Link href="/dashboard" className="flex flex-col items-center text-primary">
                    <span className="material-symbols-outlined">home</span>
                    <span className="text-[10px] font-bold mt-1">Home</span>
                </Link>
                <Link href="/dashboard" className="flex flex-col items-center text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">library_music</span>
                    <span className="text-[10px] font-bold mt-1">Projects</span>
                </Link>
                <Link href="/create" className="relative -mt-8">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 text-black transform transition-transform hover:scale-110">
                        <span className="material-symbols-outlined text-2xl">add</span>
                    </div>
                </Link>
                <Link href="/credits" className="flex flex-col items-center text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">toll</span>
                    <span className="text-[10px] font-bold mt-1">Credits</span>
                </Link>
                <Link href="/settings" className="flex flex-col items-center text-slate-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">settings</span>
                    <span className="text-[10px] font-bold mt-1">Settings</span>
                </Link>
            </div>
        </div>
    );
}
