"use client";

import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import { Music2, Sparkles, Zap, Download, Radio, Shield, Play } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-primary/30">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary rounded-lg p-1.5 flex items-center justify-center">
                            <Music2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">MusicApp</span>
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        <a href="#how-it-works" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                            How it works
                        </a>
                        <Link href="/styles" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                            Genres
                        </Link>
                        <Link href="/pricing" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                            Pricing
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <button className="text-sm font-medium text-white/70 hover:text-white px-4">
                                Login
                            </button>
                        </Link>
                        <Link href="/signup">
                            <button className="bg-white text-black hover:bg-white/90 px-5 py-2 rounded-full text-sm font-bold transition-all">
                                Get Started
                            </button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative min-h-screen pt-32 pb-16 px-6 overflow-hidden flex flex-col items-center">
                    {/* African pattern background */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M50 0 L100 50 L50 100 L0 50 Z\' fill=\'%23ffffff\' opacity=\'0.1\'/%3E%3C/svg%3E")',
                        backgroundSize: '400px'
                    }} />

                    {/* Glow effect */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'radial-gradient(circle at 50% 50%, rgba(127, 19, 236, 0.12) 0%, rgba(10, 10, 10, 0) 70%)'
                    }} />

                    <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
                        {/* Left Content */}
                        <div className="text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-6">
                                <span className="flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                </span>
                                New: Amapiano Beats Available
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
                                Turn your story into an{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#FFD700]">
                                    African song
                                </span>{" "}
                                — in minutes.
                            </h1>

                            <p className="text-lg md:text-xl text-white/60 max-w-xl mb-10 leading-relaxed">
                                Create a personalized Makossa, Afrobeats or Amapiano song for birthdays, weddings and special moments. No music skills needed.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <Link href="/signup" className="w-full sm:w-auto">
                                    <button className="w-full cta-gradient text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90">
                                        Generate my song now
                                        <Sparkles className="w-5 h-5" />
                                    </button>
                                </Link>
                                <button className="w-full sm:w-auto px-8 py-4 rounded-full text-lg font-bold border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                                    <Play className="w-5 h-5" />
                                    Play a real example
                                </button>
                            </div>

                            <div className="mt-10 flex items-center gap-4 text-sm text-white/40">
                                <div className="flex -space-x-3">
                                    <img src="https://i.pravatar.cc/150?img=1" alt="User" className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] object-cover" />
                                    <img src="https://i.pravatar.cc/150?img=2" alt="User" className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] object-cover" />
                                    <img src="https://i.pravatar.cc/150?img=3" alt="User" className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] object-cover" />
                                </div>
                                <p>Join 12,000+ happy creators</p>
                            </div>
                        </div>

                        {/* Right Card - Music Player */}
                        <div className="relative lg:justify-self-end w-full max-w-md">
                            <div className="glass-card rounded-2xl p-6 shadow-2xl relative">
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 blur-2xl rounded-full" />

                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Now Creating...</span>
                                    <span className="material-symbols-outlined text-primary">more_horiz</span>
                                </div>

                                <div className="aspect-square rounded-xl mb-6 overflow-hidden bg-[#0d0d0d] border border-white/5 relative group">
                                    <img
                                        src="https://i.pravatar.cc/400?img=5"
                                        alt="Album Art"
                                        className="w-full h-full object-cover opacity-60 transition-transform group-hover:scale-105 duration-700"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
                                            <Play className="w-8 h-8 text-white fill-white ml-1" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold mb-1">Mama&apos;s 60th Celebration</h3>
                                    <p className="text-[#FFD700] text-sm font-medium">Style: Makossa (High Tempo)</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-2/3" />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-mono text-white/40">
                                        <span>01:42</span>
                                        <span>02:30</span>
                                    </div>
                                </div>

                                <div className="mt-8 grid grid-cols-4 gap-4">
                                    {[
                                        { icon: "share", label: "Share" },
                                        { icon: "download", label: "Save" },
                                        { icon: "lyrics", label: "Lyrics" },
                                        { icon: "edit", label: "Refine", highlight: true }
                                    ].map((action, i) => (
                                        <div key={i} className="flex flex-col items-center gap-2">
                                            <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${action.highlight
                                                ? 'bg-primary/20 border border-primary/30 hover:bg-primary/30'
                                                : 'bg-white/5 hover:bg-white/10'
                                                }`}>
                                                <span className={`material-symbols-outlined text-lg ${action.highlight ? 'text-primary' : 'text-white/60'
                                                    }`}>
                                                    {action.icon}
                                                </span>
                                            </button>
                                            <span className={`text-[10px] ${action.highlight ? 'text-primary' : 'text-white/40'}`}>
                                                {action.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature Pills */}
                    <div className="w-full max-w-7xl mx-auto mt-20 border-t border-white/5 pt-12">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { icon: <Sparkles className="text-[#FFD700]" />, title: "15+ Africa Styles", desc: "Authentic rhythms" },
                                { icon: <Zap className="text-[#FFD700]" />, title: "Instant Download", desc: "MP3 & WAV format" },
                                { icon: <Radio className="text-[#FFD700]" />, title: "Studio Quality", desc: "Pro-mastered audio" },
                                { icon: <Shield className="text-[#FFD700]" />, title: "100% Personal", desc: "Your lyrics, your song" }
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#0d0d0d] flex items-center justify-center border border-white/5">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{feature.title}</p>
                                        <p className="text-[10px] text-white/40">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How it Works */}
                <section id="how-it-works" className="py-24 px-6 bg-[#0d0d0d]">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">The Process</h2>
                            <h3 className="text-4xl md:text-5xl font-bold tracking-tight">How it works</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: "queue_music",
                                    title: "Pick Your Vibe",
                                    desc: "Select from Afrobeats, Highlife, Amapiano or Makossa. Our engine understands the unique syncopation of each genre."
                                },
                                {
                                    icon: "chat",
                                    title: "Tell the Story",
                                    desc: "Share a few details about the occasion or the person. Our AI crafts poetic lyrics that resonate with African storytelling."
                                },
                                {
                                    icon: "celebration",
                                    title: "Instant Magic",
                                    desc: "Generate a full studio-quality track in under 2 minutes. Ready to play at the party or share on social media."
                                }
                            ].map((step, i) => (
                                <div key={i} className="glass-card p-10 rounded-2xl group hover:ring-1 hover:ring-primary/40 transition-all duration-300">
                                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-[#FFD700] text-3xl">{step.icon}</span>
                                    </div>
                                    <h4 className="text-2xl font-bold mb-4">{step.title}</h4>
                                    <p className="text-white/60 leading-relaxed">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 px-6 bg-[#0a0a0a] overflow-hidden relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

                    <div className="max-w-4xl mx-auto glass-card rounded-2xl p-12 md:p-16 text-center relative z-10 border-white/5">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Start your musical journey</h2>
                        <p className="text-white/60 text-lg mb-10">
                            Be the first to know when we release new genres like Coupé-Décalé and Bongo Flava.
                        </p>

                        <div className="max-w-md mx-auto">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder:text-white/30"
                                />
                                <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-full transition-all">
                                    Join Waitlist
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-12 px-6 border-t border-white/5 bg-[#0a0a0a]">
                    <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
                        <div className="flex items-center gap-2">
                            <Music2 className="text-primary" />
                            <span className="font-bold text-xl uppercase tracking-tighter">MusicApp</span>
                        </div>

                        <div className="flex flex-wrap justify-center gap-10">
                            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">About</a>
                            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Careers</a>
                            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Contact</a>
                        </div>

                        <p className="text-white/20 text-xs">© 2026 MusicApp. Celebrating African rhythms through technology.</p>
                    </div>
                </footer>
            </main>

            <style jsx>{`
        .glass-card {
          background: rgba(26, 17, 34, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .cta-gradient {
          background: linear-gradient(135deg, #7f13ec 0%, #FFD700 160%);
        }
      `}</style>
        </div>
    );
}
