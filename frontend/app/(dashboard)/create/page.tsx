"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, Loader2, Music2, Edit, Check, Clock, Globe, Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useWallet } from "@/lib/hooks/useWallet";
import { AudioRecorder } from "@/components/molecules/AudioRecorder";

interface Style {
    id: string;
    label: string;
    category: string;
}

export default function CreateWizardPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    // Step 1: Mode & Style
    const [mode, setMode] = useState<"text" | "idea">("idea");
    const [styles, setStyles] = useState<Style[]>([]);
    const [selectedStyle, setSelectedStyle] = useState("");

    // Step 2: Content
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [lyrics, setLyrics] = useState("");
    const [language, setLanguage] = useState<"en" | "fr">("fr");
    const [voice, setVoice] = useState<"auto" | "male" | "female">("auto");
    const [duration, setDuration] = useState(60);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    // Step 3: Confirmation
    const [generatingLyrics, setGeneratingLyrics] = useState(false);
    const [lyricsCandidates, setLyricsCandidates] = useState<string[]>([]);
    const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<number>(-1);

    const handleGenerateLyrics = async () => {
        if (!description) return;
        setGeneratingLyrics(true);
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch("http://localhost:8000/api/v1/generate/lyrics", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    description,
                    style: styles.find(s => s.id === selectedStyle)?.label,
                    language
                })
            });
            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
                setLyricsCandidates(data.candidates);
                // Select first by default
                setLyrics(data.candidates[0]);
                setSelectedCandidateIndex(0);
            } else if (data.lyrics) {
                setLyrics(data.lyrics);
                setLyricsCandidates([data.lyrics]);
                setSelectedCandidateIndex(0);
            }
        } catch (error) {
            console.error("Error generating lyrics:", error);
        } finally {
            setGeneratingLyrics(false);
        }
    };
    const [loading, setLoading] = useState(false);
    const { credits } = useWallet();

    useEffect(() => {
        fetchStyles();
    }, []);

    const fetchStyles = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/v1/styles/");
            const data = await response.json();
            setStyles(data.styles || data || []);
        } catch (error) {
            console.error("Error fetching styles:", error);
        }
    };





    const handleNextStep = async () => {
        if (step === 1) {
            if (selectedStyle) setStep(2);
        } else if (step === 2) {
            // Validation?
            if (mode === "text" && !lyrics) return;
            if (mode === "idea" && !lyrics) return; // Must generate first
            setStep(3);
        }
    };

    const handleSubmit = async () => {
        if (!selectedStyle || (!title && !description)) return;
        setLoading(true);

        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            // 1. Upload audio if present
            let audioUrl = null;
            if (audioBlob) {
                const fileName = `input-${Date.now()}-${session?.user?.id}.webm`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("input-audio")
                    .upload(fileName, audioBlob, {
                        contentType: "audio/webm",
                        upsert: false
                    });

                if (uploadError) throw new Error("Upload failed: " + uploadError.message);

                // Get public URL
                const { data: publicUrlData } = supabase.storage
                    .from("input-audio")
                    .getPublicUrl(fileName);

                audioUrl = publicUrlData.publicUrl;
            }

            // Create project
            const projectResponse = await fetch("http://localhost:8000/api/v1/projects/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    title: title || "New Song",
                    mode: mode === "text" ? "TEXT" : "CONTEXT",
                    language: language,
                    style_id: voice !== "auto" ? `${selectedStyle}:${voice}` : selectedStyle,
                    context_input: description, // Mapped from description
                    lyrics_final: lyrics,
                    audio_url: audioUrl || undefined,
                    // Invalid fields removed: description, settings
                })
            });

            if (!projectResponse.ok) {
                const err = await projectResponse.json();
                throw new Error(err.detail || "Failed to create project");
            }

            const project = await projectResponse.json();

            // Start generation
            const generateResponse = await fetch("http://localhost:8000/api/v1/generate/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    project_id: project.id
                })
            });

            if (!generateResponse.ok) {
                const err = await generateResponse.json();
                throw new Error(err.detail || "Failed to start generation");
            }

            const jobData = await generateResponse.json();

            // Navigate to generating page with JOB ID
            router.push(`/create/generating?job=${jobData.id}`);

        } catch (error: any) {
            console.error("Error creating project:", error);
            alert(`Error: ${error.message}`); // Simple feedback
        } finally {
            setLoading(false);
        }
    };

    const categories = [...new Set(styles.map(s => s.category))];

    const getModeIcon = (m: string) => m === "text" ? "description" : "lightbulb";

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {/* Header with Progress */}
            <div className="flex flex-col gap-4 mb-10 w-full mx-auto relative">
                <Link href="/dashboard" className="absolute -top-12 left-0 flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-medium group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Quitter
                </Link>
                <div className="flex gap-6 justify-between items-end">
                    <div>
                        <span className="text-primary font-bold text-sm uppercase tracking-widest">Step {step} of 3</span>
                        <h1 className="text-2xl md:text-3xl font-bold font-display leading-tight">
                            {step === 1 ? "Creation Mode & Style" : step === 2 ? "Song Details" : "Final Confirmation"}
                        </h1>
                    </div>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_15px_rgba(127,19,236,0.6)]"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden min-h-[500px]">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                {/* Step 1: Mode & Style */}
                {step === 1 && (
                    <div className="space-y-10 animate-fade-in">
                        {/* Mode Selection */}
                        <div>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#FFD700]">magic_button</span>
                                1. Choose Your Creation Mode
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={() => setMode("text")}
                                    className={`flex flex-col items-start p-6 rounded-xl border-2 transition-all group hover:bg-white/5 relative overflow-hidden ${mode === "text" ? "border-primary bg-primary/10" : "border-transparent bg-white/5"}`}
                                >
                                    {mode === "text" && <div className="absolute top-4 right-4 text-primary"><Check className="w-6 h-6" /></div>}
                                    <div className={`mb-4 p-3 rounded-lg ${mode === "text" ? "bg-primary/20" : "bg-white/10"}`}>
                                        <span className="material-symbols-outlined text-[#FFD700] text-3xl">description</span>
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">Text to Song</h3>
                                    <p className="text-white/60 text-sm text-left">Input your own lyrics. AI composes melody and rhythm.</p>
                                </button>

                                <button
                                    onClick={() => setMode("idea")}
                                    className={`flex flex-col items-start p-6 rounded-xl border-2 transition-all group hover:bg-white/5 relative overflow-hidden ${mode === "idea" ? "border-primary bg-primary/10" : "border-transparent bg-white/5"}`}
                                >
                                    {mode === "idea" && <div className="absolute top-4 right-4 text-primary"><Check className="w-6 h-6" /></div>}
                                    <div className={`mb-4 p-3 rounded-lg ${mode === "idea" ? "bg-primary/20" : "bg-white/10"}`}>
                                        <span className="material-symbols-outlined text-[#FFD700] text-3xl">lightbulb</span>
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">Idea to Song</h3>
                                    <p className="text-white/60 text-sm text-left">Describe a vibe or story. AI generates lyrics and music.</p>
                                </button>
                            </div>
                        </div>

                        {/* Style Selection */}
                        <div>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#FFD700]">music_note</span>
                                2. Choose Music Style
                            </h2>
                            <div className="space-y-8">
                                {categories.map((category) => (
                                    <div key={category}>
                                        <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
                                            {category}
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {styles.filter(s => s.category === category).map((style) => (
                                                <button
                                                    key={style.id}
                                                    onClick={() => setSelectedStyle(style.id)}
                                                    className={`group relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${selectedStyle === style.id ? "border-primary bg-primary/20 scale-105" : "border-white/10 bg-white/5 hover:border-primary/50"}`}
                                                >
                                                    {selectedStyle === style.id && <div className="absolute top-2 right-2 text-primary"><Check className="w-4 h-4" /></div>}
                                                    <div className="w-12 h-12 mb-3 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                        <Music2 className="w-6 h-6 text-white group-hover:text-primary" />
                                                    </div>
                                                    <span className="font-semibold text-sm">{style.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Content & Parameters */}
                {step === 2 && (
                    <div className="space-y-10 animate-fade-in">
                        {/* Input Section */}
                        <div>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#FFD700]">edit_note</span>
                                {mode === "text" ? "Enter Your Lyrics" : "Describe Your Vibe"}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-white/60 mb-2 block font-medium">Song Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ex: Summer Vibes"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>

                                {mode === "text" ? (
                                    <div>
                                        <label className="text-sm text-white/60 mb-2 block font-medium">Lyrics</label>
                                        <textarea
                                            value={lyrics}
                                            onChange={(e) => setLyrics(e.target.value)}
                                            placeholder="Paste your lyrics here..."
                                            rows={8}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors resize-none font-mono text-sm leading-relaxed"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-sm text-white/60 mb-2 block font-medium">Description / Story</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="A song about finding inner peace in the chaotic city..."
                                            rows={4}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors resize-none leading-relaxed mb-4"
                                        />

                                        {!lyricsCandidates.length && (
                                            <button
                                                onClick={handleGenerateLyrics}
                                                disabled={!description || generatingLyrics}
                                                className="w-full py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {generatingLyrics ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Generating Lyrics...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-5 h-5" />
                                                        Generate Lyrics from Idea
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {lyricsCandidates.length > 0 && (
                                            <div className="space-y-4 animate-fade-in mt-6">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm text-white/60 font-medium">Choose a Version</label>
                                                    <button
                                                        onClick={() => { setLyricsCandidates([]); setLyrics(""); }}
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        Reset & Try Again
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    {lyricsCandidates.map((cand, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                setSelectedCandidateIndex(idx);
                                                                setLyrics(cand);
                                                            }}
                                                            className={`p-4 rounded-xl border text-left transition-all ${selectedCandidateIndex === idx
                                                                ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(244,192,37,0.2)]"
                                                                : "bg-white/5 border-white/10 hover:bg-white/10"
                                                                }`}
                                                        >
                                                            <span className="text-xs font-bold uppercase tracking-wider text-white/40 block mb-2">Option {idx + 1}</span>
                                                            <p className="text-white/80 text-xs line-clamp-3">{cand}</p>
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="pt-4 border-t border-white/10">
                                                    <label className="text-sm text-white/60 mb-2 block font-medium">Edit Selected Lyrics</label>
                                                    <textarea
                                                        value={lyrics}
                                                        onChange={(e) => setLyrics(e.target.value)}
                                                        rows={10}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors resize-none font-mono text-sm leading-relaxed"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Audio Recorder Input (Optional) */}
                        <div className="pt-6 border-t border-white/10">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#FFD700]">mic</span>
                                Add Vocal Guide (Optional)
                            </h2>
                            <p className="text-white/60 text-sm mb-4">
                                Record a melody, beatbox, or singing to guide the AI.
                                <span className="text-primary block mt-1 font-bold">The AI will use this audio as the foundation.</span>
                            </p>
                            <AudioRecorder
                                onAudioCaptured={(blob) => setAudioBlob(blob)}
                                onClear={() => setAudioBlob(null)}
                            />
                        </div>

                        {/* Parameters */}
                        <div className="flex flex-col gap-8 pt-6 border-t border-white/10">
                            {/* Language */}
                            <div className="w-full">
                                <label className="text-sm text-white/40 font-bold uppercase tracking-wider mb-4 block">Lyrics Language</label>
                                <div className="flex gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                                    <button
                                        onClick={() => setLanguage("en")}
                                        className={`flex-1 py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-3 ${language === "en" ? "bg-primary text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                                    >
                                        <span className="text-2xl">🇬🇧</span> ENGLISH
                                    </button>
                                    <button
                                        onClick={() => setLanguage("fr")}
                                        className={`flex-1 py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-3 ${language === "fr" ? "bg-primary text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                                    >
                                        <span className="text-2xl">🇫🇷</span> FRANÇAIS
                                    </button>
                                </div>
                            </div>

                            {/* Voice Preference */}
                            <div className="w-full">
                                <label className="text-sm text-white/40 font-bold uppercase tracking-wider mb-4 block">Vocal Preference</label>
                                <div className="flex gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                                    <button
                                        onClick={() => setVoice("auto")}
                                        className={`flex-1 py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 ${voice === "auto" ? "bg-white/10 text-white shadow-lg border border-white/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                                    >
                                        <span className="material-symbols-outlined">graphic_eq</span> Auto
                                    </button>
                                    <button
                                        onClick={() => setVoice("male")}
                                        className={`flex-1 py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 ${voice === "male" ? "bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                                    >
                                        <span className="material-symbols-outlined">man</span> Male
                                    </button>
                                    <button
                                        onClick={() => setVoice("female")}
                                        className={`flex-1 py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 ${voice === "female" ? "bg-pink-500/20 text-pink-400 border border-pink-500/50 shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                                    >
                                        <span className="material-symbols-outlined">woman</span> Female
                                    </button>
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="w-full">
                                <div className="flex justify-between mb-4">
                                    <label className="text-sm text-white/40 font-bold uppercase tracking-wider">Duration</label>
                                    <span className="text-primary font-bold text-lg">{Math.floor(duration / 60)}m {duration % 60}s</span>
                                </div>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                    <input
                                        type="range"
                                        min="30"
                                        max="300"
                                        step="30"
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value))}
                                        className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between mt-4 text-xs font-bold text-white/40 uppercase tracking-wider">
                                        <span>30 Seconds</span>
                                        <span>2.5 Minutes</span>
                                        <span>5 Minutes</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Confirmation */}
                {
                    step === 3 && (
                        <div className="space-y-8 animate-fade-in text-center">
                            <div className="flex flex-col items-center">
                                <h2 className="text-3xl font-bold mb-2">Review Your Creation</h2>
                                <p className="text-white/60">Your masterpiece is just one click away.</p>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8 text-left max-w-5xl mx-auto shadow-2xl relative overflow-hidden">
                                {/* Abstract bg in card */}
                                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

                                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                                        <Music2 className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">
                                                    {styles.find(s => s.id === selectedStyle)?.label || "Unknown Style"}
                                                </p>
                                                <h3 className="text-2xl font-bold">{title || "Untitled Track"}</h3>
                                            </div>
                                            <button onClick={() => setStep(2)} className="text-white/40 hover:text-white transition-colors">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                    <Globe className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-white/40 uppercase font-bold">Language</p>
                                                    <p className="text-sm font-medium">{language === "en" ? "English" : "Français"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                    <Clock className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-white/40 uppercase font-bold">Duration</p>
                                                    <p className="text-sm font-medium">{duration} Seconds</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Audio Present */}
                                        {audioBlob && (
                                            <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center gap-3 border border-primary/20">
                                                <Mic className="w-5 h-5 text-primary" />
                                                <span className="text-sm font-bold text-primary">Audio Guide Included</span>
                                            </div>
                                        )}

                                        {/* Lyrics Preview if generated */}
                                        {lyrics && (
                                            <div className="mt-4">
                                                <p className="text-[10px] text-white/40 uppercase font-bold mb-2">Lyrics Preview</p>
                                                <p className="text-white/60 text-sm line-clamp-3 italic">"{lyrics.split('\n')[0]}..."</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Cost & Balance */}
                            <div className="flex justify-center gap-6 max-w-2xl mx-auto">
                                <div className="flex-1 bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
                                    <p className="text-primary text-xs font-bold uppercase tracking-wider mb-1">Cost</p>
                                    <p className="text-3xl font-bold">5 <span className="text-sm font-medium text-white/60">Credits</span></p>
                                </div>
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Your Balance</p>
                                    <p className="text-3xl font-bold">{credits} <span className="text-sm font-medium text-white/60">Credits</span></p>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Sticky Footer Navigation */}
            < div className="mt-8 flex justify-between items-center pt-8 border-t border-white/10" >
                <button
                    onClick={() => step > 1 && setStep(step - 1)}
                    disabled={step === 1}
                    className="flex items-center gap-2 px-6 h-12 rounded-lg border border-white/10 text-white/60 font-bold hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>

                {
                    step === 3 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={loading || (credits < 5)}
                            className="flex items-center gap-2 px-10 h-14 rounded-full bg-gradient-to-r from-primary to-[#FFD700] text-black font-bold text-lg hover:shadow-[0_0_30px_rgba(127,19,236,0.4)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 fill-black" />
                                    Generate Track (5 Cr.)
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleNextStep}
                            disabled={step === 1 && !selectedStyle || step === 2 && (!title || !lyrics)}
                            className="flex items-center gap-2 px-8 h-12 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/5"
                        >
                            Next Step
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    )
                }
            </div >
        </div >
    );
}
