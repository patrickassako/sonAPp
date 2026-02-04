"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import { Music2, Sparkles, Zap, Download, Radio, Shield, Play, Pause } from "lucide-react";

const HERO_TRACK = {
    title: "Une demande de Saint-Valentin",
    style: "Afrobeats romantique",
    url: "https://qcreokbkvddbhwctuogz.supabase.co/storage/v1/object/public/sample/saint%20valentin.mp3",
};

const PREVIEW_TRACKS = [
    { title: "Makossa Dansons", style: "Makossa", color: "from-orange-500 to-yellow-500", url: "https://qcreokbkvddbhwctuogz.supabase.co/storage/v1/object/public/sample/Makossa%20dansons.mp3" },
    { title: "Makossa Groove", style: "Makossa", color: "from-green-500 to-emerald-500", url: "https://qcreokbkvddbhwctuogz.supabase.co/storage/v1/object/public/sample/Test%20Makossa%20(1).mp3" },
    { title: "Drill Code", style: "Drill", color: "from-red-500 to-rose-500", url: "https://qcreokbkvddbhwctuogz.supabase.co/storage/v1/object/public/sample/Drill%20code.mp3" },
    { title: "Joyeux Anniversaire", style: "Afropop", color: "from-purple-500 to-pink-500", url: "https://qcreokbkvddbhwctuogz.supabase.co/storage/v1/object/public/sample/M2U4Y2YxZjEtMmY4Mi00Njk2LTg2MjctZTY3YWI3ZDQ0MGMz.mp3" },
    { title: "Slow Bikutsi", style: "Bikutsi", color: "from-blue-500 to-cyan-500", url: "https://qcreokbkvddbhwctuogz.supabase.co/storage/v1/object/public/sample/Bikutsi.mp3" },
    { title: "Boucan", style: "Coupé-décalé", color: "from-amber-500 to-orange-500", url: "https://qcreokbkvddbhwctuogz.supabase.co/storage/v1/object/public/sample/coupedecale1.mp3" },
    { title: "Coupé-décalé Bibliki", style: "Coupé-décalé", color: "from-pink-500 to-fuchsia-500", url: "https://qcreokbkvddbhwctuogz.supabase.co/storage/v1/object/public/sample/voir%20sond%20bibliki.mp3" },
];

export default function LandingPage() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playingUrl, setPlayingUrl] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState("00:00");
    const [duration, setDuration] = useState("00:00");

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = Math.floor(seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const playTrack = useCallback((url: string) => {
        const audio = audioRef.current;
        if (!audio) return;

        if (playingUrl === url) {
            // Toggle pause/play for the same track
            if (audio.paused) {
                audio.play();
            } else {
                audio.pause();
                setPlayingUrl(null);
            }
            return;
        }

        // Switch to new track
        audio.src = url;
        audio.play();
        setPlayingUrl(url);
        setProgress(0);
        setCurrentTime("00:00");
    }, [playingUrl]);

    const toggleHeroPlay = () => playTrack(HERO_TRACK.url);

    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(formatTime(audio.currentTime));
    };

    const handleLoadedMetadata = () => {
        const audio = audioRef.current;
        if (!audio) return;
        setDuration(formatTime(audio.duration));
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = x / rect.width;
        audio.currentTime = pct * audio.duration;
    };

    const isHeroPlaying = playingUrl === HERO_TRACK.url;
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
                            Comment ça marche
                        </a>
                        <Link href="/styles" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                            Styles
                        </Link>
                        <Link href="/pricing" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                            Tarifs
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <button className="text-sm font-medium text-white/70 hover:text-white px-4">
                                Connexion
                            </button>
                        </Link>
                        <Link href="/signup">
                            <button className="bg-gradient-to-r from-pink-500 to-red-500 text-white hover:opacity-90 px-5 py-2 rounded-full text-sm font-bold transition-all">
                                💕 Offre St-Valentin
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
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                                <span className="flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-500 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
                                </span>
                                💕 Offre Saint-Valentin : -20% jusqu'au 14 Février
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
                                Offrez une chanson{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#FFD700]">
                                    unique au monde
                                </span>{" "}
                                à ceux que vous aimez.
                            </h1>

                            <p className="text-lg md:text-xl text-white/60 max-w-xl mb-10 leading-relaxed">
                                Une déclaration d'amour, un mariage, un anniversaire, des excuses sincères ou un hommage... Transformez vos émotions en une chanson personnalisée qui restera gravée pour toujours.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <Link href="/signup" className="w-full sm:w-auto">
                                    <button className="w-full cta-gradient text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90">
                                        Créer ma chanson maintenant
                                        <Sparkles className="w-5 h-5" />
                                    </button>
                                </Link>
                                <button
                                    onClick={toggleHeroPlay}
                                    className="w-full sm:w-auto px-8 py-4 rounded-full text-lg font-bold border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                >
                                    {isHeroPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    {isHeroPlaying ? "Mettre en pause" : "Écouter un exemple"}
                                </button>
                            </div>

                            <div className="mt-10 flex items-center gap-4 text-sm text-white/40">
                                <div className="flex -space-x-3">
                                    <img src="https://i.pravatar.cc/150?img=1" alt="User" className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] object-cover" />
                                    <img src="https://i.pravatar.cc/150?img=2" alt="User" className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] object-cover" />
                                    <img src="https://i.pravatar.cc/150?img=3" alt="User" className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] object-cover" />
                                </div>
                                <p>+2 500 moments inoubliables créés</p>
                            </div>
                        </div>

                        {/* Right Card - Music Player */}
                        <div className="relative lg:justify-self-end w-full max-w-md">
                            <audio
                                ref={audioRef}
                                preload="metadata"
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onEnded={() => { setPlayingUrl(null); setProgress(0); setCurrentTime("00:00"); }}
                                onPause={() => { if (audioRef.current?.ended) return; }}
                            />
                            <div className="glass-card rounded-2xl p-6 shadow-2xl relative">
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 blur-2xl rounded-full" />

                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">💕 Saint-Valentin</span>
                                    <span className="material-symbols-outlined text-primary">more_horiz</span>
                                </div>

                                <div
                                    className="aspect-square rounded-xl mb-6 overflow-hidden bg-[#0d0d0d] border border-white/5 relative group cursor-pointer"
                                    onClick={toggleHeroPlay}
                                >
                                    <img
                                        src="/images/valentine-cover.png"
                                        alt="Une demande de Saint-Valentin"
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-16 h-16 rounded-full bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/40">
                                            {isHeroPlaying ? (
                                                <Pause className="w-8 h-8 text-white fill-white" />
                                            ) : (
                                                <Play className="w-8 h-8 text-white fill-white ml-1" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold mb-1">"Une demande de Saint-Valentin"</h3>
                                    <p className="text-pink-400 text-sm font-medium">💍 Demande en mariage • Afrobeats romantique</p>
                                </div>

                                <div className="space-y-4">
                                    <div
                                        className="h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer"
                                        onClick={handleProgressClick}
                                    >
                                        <div
                                            className="h-full bg-primary transition-all duration-150"
                                            style={{ width: `${isHeroPlaying ? progress : 0}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-mono text-white/40">
                                        <span>{isHeroPlaying ? currentTime : "00:00"}</span>
                                        <span>{isHeroPlaying ? duration : "--:--"}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center mt-6">
                                    <button
                                        onClick={toggleHeroPlay}
                                        className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 hover:bg-primary/30 flex items-center justify-center transition-colors"
                                    >
                                        {isHeroPlaying ? (
                                            <Pause className="w-6 h-6 text-primary" />
                                        ) : (
                                            <Play className="w-6 h-6 text-primary ml-0.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature Pills */}
                    <div className="w-full max-w-7xl mx-auto mt-20 border-t border-white/5 pt-12">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { icon: <Sparkles className="text-[#FFD700]" />, title: "Unique au monde", desc: "Créée juste pour vous" },
                                { icon: <Zap className="text-[#FFD700]" />, title: "Prête en 2 min", desc: "Téléchargement instant" },
                                { icon: <Radio className="text-[#FFD700]" />, title: "Qualité Studio", desc: "Son professionnel" },
                                { icon: <Shield className="text-[#FFD700]" />, title: "Vos mots, votre voix", desc: "100% personnalisée" }
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

                {/* Occasions Section */}
                <section className="py-24 px-6 bg-[#0d0d0d] border-t border-white/5">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-pink-400 font-bold uppercase tracking-widest text-sm mb-4">Pour chaque moment de vie</h2>
                            <h3 className="text-4xl md:text-5xl font-bold tracking-tight">Une chanson pour chaque émotion</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[
                                { emoji: "💕", title: "Saint-Valentin", desc: "Déclarez votre amour" },
                                { emoji: "💍", title: "Demande en mariage", desc: "Le plus beau OUI" },
                                { emoji: "👰", title: "Mariage", desc: "Votre premier slow" },
                                { emoji: "🎂", title: "Anniversaire", desc: "Un cadeau unique" },
                                { emoji: "🙏", title: "Excuses", desc: "Des mots qui touchent" },
                                { emoji: "🕯️", title: "Hommage", desc: "Un souvenir éternel" },
                            ].map((occasion, i) => (
                                <div key={i} className="glass-card p-6 rounded-2xl text-center group hover:ring-1 hover:ring-primary/40 transition-all duration-300 hover:scale-105">
                                    <span className="text-4xl mb-4 block">{occasion.emoji}</span>
                                    <h4 className="font-bold mb-1">{occasion.title}</h4>
                                    <p className="text-white/40 text-xs">{occasion.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Audio Previews */}
                <section id="previews" className="py-24 px-6 bg-[#0a0a0a] border-t border-white/5">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">Nos créations</h2>
                            <h3 className="text-4xl md:text-5xl font-bold tracking-tight">Écoutez des exemples</h3>
                            <p className="text-white/50 mt-4 max-w-2xl mx-auto">Chaque chanson est unique, créée par notre IA à partir des émotions de nos utilisateurs.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {PREVIEW_TRACKS.map((track, i) => {
                                const isActive = playingUrl === track.url;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => playTrack(track.url)}
                                        className={`glass-card rounded-xl p-4 flex items-center gap-4 text-left transition-all duration-200 hover:ring-1 hover:ring-primary/40 group ${isActive ? 'ring-1 ring-primary/60 bg-primary/5' : ''}`}
                                    >
                                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${track.color} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                                            {isActive ? (
                                                <Pause className="w-5 h-5 text-white" />
                                            ) : (
                                                <Play className="w-5 h-5 text-white ml-0.5" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`font-bold text-sm truncate ${isActive ? 'text-primary' : 'text-white'}`}>{track.title}</p>
                                            <p className="text-white/40 text-xs">{track.style}</p>
                                            {isActive && (
                                                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary transition-all duration-150" style={{ width: `${progress}%` }} />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* How it Works */}
                <section id="how-it-works" className="py-24 px-6 bg-[#0a0a0a]">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">Simple comme bonjour</h2>
                            <h3 className="text-4xl md:text-5xl font-bold tracking-tight">Comment ça marche ?</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: "favorite",
                                    title: "1. Racontez votre histoire",
                                    desc: "Parlez-nous de la personne, de l'occasion, de ce que vous ressentez. Plus c'est personnel, plus la chanson sera touchante."
                                },
                                {
                                    icon: "music_note",
                                    title: "2. Choisissez l'ambiance",
                                    desc: "Afrobeats romantique, Makossa festif, ballade douce... Sélectionnez le style qui correspond à l'émotion que vous voulez transmettre."
                                },
                                {
                                    icon: "card_giftcard",
                                    title: "3. Offrez l'inoubliable",
                                    desc: "En 2 minutes, recevez une chanson unique au monde. Téléchargez-la, partagez-la, et créez un souvenir qui durera toute une vie."
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

                {/* Valentine CTA Section */}
                <section className="py-24 px-6 bg-[#0d0d0d] overflow-hidden relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none" />

                    <div className="max-w-4xl mx-auto glass-card rounded-2xl p-12 md:p-16 text-center relative z-10 border-pink-500/20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-sm font-bold mb-6">
                            💕 Offre limitée Saint-Valentin
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            Cette année, offrez plus qu'un cadeau.<br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-400">Offrez une émotion.</span>
                        </h2>
                        <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto">
                            Imaginez sa réaction quand il/elle entendra une chanson écrite rien que pour lui/elle, avec son prénom, votre histoire, vos souvenirs...
                        </p>

                        <Link href="/signup">
                            <button className="bg-gradient-to-r from-pink-500 to-red-500 hover:opacity-90 text-white font-bold px-10 py-5 rounded-full transition-all text-lg shadow-xl shadow-pink-500/20">
                                Créer ma chanson d'amour 💕
                            </button>
                        </Link>
                        <p className="mt-6 text-white/40 text-sm">-20% avec le code VALENTIN2026 • Valable jusqu'au 14 Février</p>
                    </div>
                </section>

                {/* Testimonials placeholder */}
                <section className="py-24 px-6 bg-[#0a0a0a]">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-primary font-bold uppercase tracking-widest text-sm mb-4">Ils l'ont fait</h2>
                            <h3 className="text-4xl md:text-5xl font-bold tracking-tight">Des moments magiques</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    quote: "Ma femme a pleuré de joie. 15 ans de mariage résumés en 3 minutes de chanson. Le plus beau cadeau que je lui ai fait.",
                                    author: "Marc K.",
                                    occasion: "Anniversaire de mariage"
                                },
                                {
                                    quote: "Elle a dit OUI avant même que la chanson soit finie ! Notre histoire d'amour chantée, c'était magique.",
                                    author: "Thierry M.",
                                    occasion: "Demande en mariage"
                                },
                                {
                                    quote: "Pour l'enterrement de ma mère, j'ai fait une chanson avec ses expressions préférées. Toute la famille était émue.",
                                    author: "Aminata D.",
                                    occasion: "Hommage"
                                }
                            ].map((testimonial, i) => (
                                <div key={i} className="glass-card p-8 rounded-2xl">
                                    <p className="text-white/80 mb-6 italic">"{testimonial.quote}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                            {testimonial.author.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{testimonial.author}</p>
                                            <p className="text-[#FFD700] text-xs">{testimonial.occasion}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">À propos</a>
                            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">FAQ</a>
                            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Confidentialité</a>
                            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Contact</a>
                        </div>

                        <p className="text-white/20 text-xs">© 2026 MusicApp. Transformez vos émotions en musique.</p>
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
