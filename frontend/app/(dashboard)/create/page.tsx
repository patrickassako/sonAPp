"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, Loader2, Music2, Edit, Check, Globe, Mic, Wand2, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { API_BASE_URL } from "@/lib/api/client";
import { useWallet } from "@/lib/hooks/useWallet";
import { AudioRecorder } from "@/components/molecules/AudioRecorder";
import { useTranslation } from "@/i18n/useTranslation";

interface Style {
    id: string;
    label: string;
    category: string;
}

export default function CreateWizardPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [step, setStep] = useState(1);

    // Step 1: Mode & Style
    const [mode, setMode] = useState<"text" | "idea">("idea");
    const [styles, setStyles] = useState<Style[]>([]);
    const [selectedStyle, setSelectedStyle] = useState("");
    const [customStyleText, setCustomStyleText] = useState("");

    // Step 2: Content
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [lyrics, setLyrics] = useState("");
    const [language, setLanguage] = useState<"en" | "fr">("fr");
    const [voice, setVoice] = useState<"auto" | "male" | "female">("auto");
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [generateVideo, setGenerateVideo] = useState(false);

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

            const response = await fetch(`${API_BASE_URL}/api/v1/generate/lyrics`, {
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

            if (response.status === 402) {
                setGeneratingLyrics(false);
                if (confirm(t("create.insufficientLyricsAlert"))) {
                    router.push("/credits");
                }
                return;
            }

            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
                setLyricsCandidates(data.candidates);
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

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [step]);

    const fetchStyles = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/styles/`);
            const data = await response.json();
            setStyles(data.styles || data || []);
        } catch (error) {
            console.error("Error fetching styles:", error);
        }
    };

    const handleNextStep = async () => {
        if (step === 1) {
            if (selectedStyle && (selectedStyle !== "custom" || customStyleText.trim().length > 0)) setStep(2);
        } else if (step === 2) {
            if (mode === "text" && !lyrics && !audioBlob) return;
            if (mode === "idea" && !lyrics && !audioBlob) return;
            setStep(3);
        }
    };

    const getCost = () => {
        let cost = 4;
        if (mode === "idea") cost = 3;

        if (audioBlob) {
            if (lyrics) {
                cost += 1;
            } else {
                cost += 2;
            }
        }

        if (generateVideo) {
            cost += 4;
        }

        return cost;
    };

    const handleSubmit = async () => {
        if (!selectedStyle || (!title && !description)) return;
        setLoading(true);

        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

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

                const { data: publicUrlData } = supabase.storage
                    .from("input-audio")
                    .getPublicUrl(fileName);

                audioUrl = publicUrlData.publicUrl;
            }

            const projectResponse = await fetch(`${API_BASE_URL}/api/v1/projects/`, {
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
                    custom_style_text: selectedStyle === "custom" ? customStyleText : undefined,
                    context_input: description,
                    lyrics_final: lyrics,
                    audio_url: audioUrl || undefined,
                    generate_video: generateVideo,
                })
            });

            if (!projectResponse.ok) {
                const err = await projectResponse.json();
                throw new Error(err.detail || "Failed to create project");
            }

            const project = await projectResponse.json();

            const generateResponse = await fetch(`${API_BASE_URL}/api/v1/generate/`, {
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
                if (generateResponse.status === 402) {
                    setLoading(false);
                    if (confirm(t("create.insufficientCreditsAlert"))) {
                        router.push("/credits");
                    }
                    return;
                }
                throw new Error(err.detail || "Failed to start generation");
            }

            const jobData = await generateResponse.json();
            router.push(`/create/generating?job=${jobData.id}`);

        } catch (error: any) {
            console.error("Error creating project:", error);
            if (error.message?.includes("credit") || error.message?.includes("Credit")) {
                if (confirm(t("create.insufficientCreditsAlert"))) {
                    router.push("/credits");
                    return;
                }
            } else {
                alert(t("create.errorPrefix", { message: error.message }));
            }
        } finally {
            setLoading(false);
        }
    };

    const categories = [...new Set(styles.map(s => s.category))];

    return (
        <div className="px-3 py-3 md:p-8 max-w-7xl mx-auto w-full pb-28 md:pb-8">
            {/* Header with Progress */}
            <div className="flex flex-col gap-3 mb-6 md:mb-10 w-full mx-auto">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm font-medium group shrink-0">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline">{t("create.quit")}</span>
                    </Link>
                    <div className="flex-1 min-w-0">
                        <span className="text-primary font-bold text-xs uppercase tracking-widest">{t("create.stepLabel", { step })}</span>
                        <h1 className="text-lg md:text-3xl font-bold font-display leading-tight truncate">
                            {step === 1 ? t("create.step1Title") : step === 2 ? t("create.step2Title") : t("create.step3Title")}
                        </h1>
                    </div>
                </div>
                <div className="h-1.5 md:h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_15px_rgba(127,19,236,0.6)]"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-[#1e1e1e] border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-10 shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                {/* Step 1: Mode & Style */}
                {step === 1 && (
                    <div className="space-y-6 md:space-y-10 animate-fade-in">
                        {/* Mode Selection */}
                        <div>
                            <h2 className="text-base md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#FFD700] text-xl md:text-2xl">magic_button</span>
                                {t("create.modeTitle")}
                            </h2>
                            <div className="grid grid-cols-2 gap-3 md:gap-6">
                                <button
                                    onClick={() => setMode("text")}
                                    className={`flex flex-col items-start p-3 md:p-6 rounded-xl border-2 transition-all group hover:bg-white/5 relative overflow-hidden ${mode === "text" ? "border-primary bg-primary/10" : "border-transparent bg-white/5"}`}
                                >
                                    {mode === "text" && <div className="absolute top-2 right-2 md:top-4 md:right-4 text-primary"><Check className="w-5 h-5" /></div>}
                                    <div className={`mb-2 md:mb-4 p-2 md:p-3 rounded-lg ${mode === "text" ? "bg-primary/20" : "bg-white/10"}`}>
                                        <span className="material-symbols-outlined text-[#FFD700] text-2xl md:text-3xl">description</span>
                                    </div>
                                    <h3 className="text-sm md:text-lg font-bold mb-1">{t("create.modeText")}</h3>
                                    <p className="text-white/60 text-xs text-left hidden md:block">{t("create.modeTextDesc")}</p>
                                </button>

                                <button
                                    onClick={() => setMode("idea")}
                                    className={`flex flex-col items-start p-3 md:p-6 rounded-xl border-2 transition-all group hover:bg-white/5 relative overflow-hidden ${mode === "idea" ? "border-primary bg-primary/10" : "border-transparent bg-white/5"}`}
                                >
                                    {mode === "idea" && <div className="absolute top-2 right-2 md:top-4 md:right-4 text-primary"><Check className="w-5 h-5" /></div>}
                                    <div className={`mb-2 md:mb-4 p-2 md:p-3 rounded-lg ${mode === "idea" ? "bg-primary/20" : "bg-white/10"}`}>
                                        <span className="material-symbols-outlined text-[#FFD700] text-2xl md:text-3xl">lightbulb</span>
                                    </div>
                                    <h3 className="text-sm md:text-lg font-bold mb-1">{t("create.modeIdea")}</h3>
                                    <p className="text-white/60 text-xs text-left hidden md:block">{t("create.modeIdeaDesc")}</p>
                                </button>
                            </div>
                        </div>

                        {/* Style Selection */}
                        <div>
                            <h2 className="text-base md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#FFD700] text-xl md:text-2xl">music_note</span>
                                {t("create.styleTitle")}
                            </h2>
                            <div className="space-y-5 md:space-y-8">
                                {categories.map((category) => (
                                    <div key={category}>
                                        <h3 className="text-xs md:text-sm font-bold text-white/40 uppercase tracking-wider mb-3 border-b border-white/5 pb-2">
                                            {category}
                                        </h3>
                                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
                                            {styles.filter(s => s.category === category).map((style) => (
                                                <button
                                                    key={style.id}
                                                    onClick={() => setSelectedStyle(style.id)}
                                                    className={`group relative flex flex-col items-center justify-center p-2.5 md:p-4 rounded-xl border transition-all ${selectedStyle === style.id ? "border-primary bg-primary/20 scale-105" : "border-white/10 bg-white/5 hover:border-primary/50"}`}
                                                >
                                                    {selectedStyle === style.id && <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 text-primary"><Check className="w-3.5 h-3.5 md:w-4 md:h-4" /></div>}
                                                    <div className="w-9 h-9 md:w-12 md:h-12 mb-1.5 md:mb-3 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                        <Music2 className="w-4 h-4 md:w-6 md:h-6 text-white group-hover:text-primary" />
                                                    </div>
                                                    <span className="font-semibold text-[11px] md:text-sm leading-tight text-center">{style.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Custom Style Option */}
                                <div>
                                    <h3 className="text-xs md:text-sm font-bold text-white/40 uppercase tracking-wider mb-3 border-b border-white/5 pb-2">
                                        {t("create.customCategory")}
                                    </h3>
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
                                        <button
                                            onClick={() => setSelectedStyle("custom")}
                                            className={`group relative flex flex-col items-center justify-center p-2.5 md:p-4 rounded-xl border transition-all ${selectedStyle === "custom" ? "border-primary bg-primary/20 scale-105" : "border-white/10 bg-white/5 hover:border-primary/50"}`}
                                        >
                                            {selectedStyle === "custom" && <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 text-primary"><Check className="w-3.5 h-3.5 md:w-4 md:h-4" /></div>}
                                            <div className="w-9 h-9 md:w-12 md:h-12 mb-1.5 md:mb-3 rounded-full bg-gradient-to-br from-primary/30 to-[#FFD700]/30 flex items-center justify-center group-hover:from-primary/40 group-hover:to-[#FFD700]/40 transition-colors">
                                                <Wand2 className="w-4 h-4 md:w-6 md:h-6 text-[#FFD700] group-hover:text-primary" />
                                            </div>
                                            <span className="font-semibold text-[11px] md:text-sm">{t("create.customLabel")}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Custom Style Textarea */}
                                {selectedStyle === "custom" && (
                                    <div className="mt-4 md:mt-6 animate-fade-in">
                                        <label className="text-sm text-white/60 mb-2 block font-medium">{t("create.customStyleLabel")}</label>
                                        <textarea
                                            value={customStyleText}
                                            onChange={(e) => setCustomStyleText(e.target.value)}
                                            placeholder={t("create.customStylePlaceholder")}
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors resize-none leading-relaxed"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Content & Parameters */}
                {step === 2 && (
                    <div className="space-y-6 md:space-y-10 animate-fade-in">
                        {/* Input Section */}
                        <div>
                            <h2 className="text-base md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#FFD700] text-xl md:text-2xl">edit_note</span>
                                {mode === "text" ? t("create.lyricsTitle") : t("create.ideaTitle")}
                            </h2>

                            <div className="space-y-3 md:space-y-4">
                                <div>
                                    <label className="text-sm text-white/60 mb-1.5 block font-medium">{t("create.songTitleLabel")}</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={t("create.songTitlePlaceholder")}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>

                                {mode === "text" ? (
                                    <div>
                                        <label className="text-sm text-white/60 mb-1.5 block font-medium">{t("create.lyricsLabel")}</label>
                                        <textarea
                                            value={lyrics}
                                            onChange={(e) => setLyrics(e.target.value)}
                                            placeholder={t("create.lyricsPlaceholder")}
                                            rows={6}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors resize-none font-mono text-sm leading-relaxed"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-sm text-white/60 mb-1.5 block font-medium">{t("create.descriptionLabel")}</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder={t("create.descriptionPlaceholder")}
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors resize-none leading-relaxed mb-3"
                                        />

                                        {!lyricsCandidates.length && (
                                            <button
                                                onClick={handleGenerateLyrics}
                                                disabled={!description || generatingLyrics}
                                                className="w-full py-2.5 md:py-3 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {generatingLyrics ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        {t("create.generatingLyrics")}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4" />
                                                        {t("create.generateLyrics")}
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {lyricsCandidates.length > 0 && (
                                            <div className="space-y-3 animate-fade-in mt-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm text-white/60 font-medium">{t("create.chooseLyricsVersion")}</label>
                                                    <button
                                                        onClick={() => { setLyricsCandidates([]); setLyrics(""); }}
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        {t("create.retryLyrics")}
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
                                                    {lyricsCandidates.map((cand, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                setSelectedCandidateIndex(idx);
                                                                setLyrics(cand);
                                                            }}
                                                            className={`p-3 md:p-4 rounded-xl border text-left transition-all ${selectedCandidateIndex === idx
                                                                ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(244,192,37,0.2)]"
                                                                : "bg-white/5 border-white/10 hover:bg-white/10"
                                                                }`}
                                                        >
                                                            <span className="text-xs font-bold uppercase tracking-wider text-white/40 block mb-1">{t("create.option", { idx: idx + 1 })}</span>
                                                            <p className="text-white/80 text-xs line-clamp-3">{cand}</p>
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="pt-3 border-t border-white/10">
                                                    <label className="text-sm text-white/60 mb-1.5 block font-medium">{t("create.editLyrics")}</label>
                                                    <textarea
                                                        value={lyrics}
                                                        onChange={(e) => setLyrics(e.target.value)}
                                                        rows={8}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-primary transition-colors resize-none font-mono text-sm leading-relaxed"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Audio Recorder Input (Optional) */}
                        <div className="pt-4 md:pt-6 border-t border-white/10">
                            <h2 className="text-base md:text-xl font-bold mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#FFD700] text-xl md:text-2xl">mic</span>
                                {t("create.audioGuideTitle")}
                            </h2>
                            <p className="text-white/60 text-xs md:text-sm mb-3">
                                {t("create.audioGuideDesc")}
                            </p>
                            <AudioRecorder
                                onAudioCaptured={(blob) => setAudioBlob(blob)}
                                onClear={() => setAudioBlob(null)}
                            />
                        </div>

                        {/* Parameters */}
                        <div className="flex flex-col gap-5 md:gap-8 pt-4 md:pt-6 border-t border-white/10">
                            {/* Language */}
                            <div className="w-full">
                                <label className="text-xs md:text-sm text-white/40 font-bold uppercase tracking-wider mb-2 md:mb-4 block">{t("create.languageLabel")}</label>
                                <div className="flex gap-2 md:gap-4 bg-white/5 p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-white/10">
                                    <button
                                        onClick={() => setLanguage("en")}
                                        className={`flex-1 py-2.5 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base font-bold transition-all flex items-center justify-center gap-2 ${language === "en" ? "bg-primary text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                                    >
                                        <span className="text-lg md:text-2xl">🇬🇧</span> <span className="hidden sm:inline">ENGLISH</span><span className="sm:hidden">EN</span>
                                    </button>
                                    <button
                                        onClick={() => setLanguage("fr")}
                                        className={`flex-1 py-2.5 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base font-bold transition-all flex items-center justify-center gap-2 ${language === "fr" ? "bg-primary text-white shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                                    >
                                        <span className="text-lg md:text-2xl">🇫🇷</span> <span className="hidden sm:inline">FRANÇAIS</span><span className="sm:hidden">FR</span>
                                    </button>
                                </div>
                            </div>

                            {/* Voice Preference */}
                            <div className="w-full">
                                <label className="text-xs md:text-sm text-white/40 font-bold uppercase tracking-wider mb-2 md:mb-4 block">{t("create.voiceLabel")}</label>
                                <div className="flex gap-2 md:gap-4 bg-white/5 p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-white/10">
                                    <button
                                        onClick={() => setVoice("auto")}
                                        className={`flex-1 py-2.5 md:py-4 rounded-lg md:rounded-xl text-xs md:text-base font-bold transition-all flex items-center justify-center gap-1 md:gap-2 ${voice === "auto" ? "bg-white/10 text-white shadow-lg border border-white/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                                    >
                                        <span className="material-symbols-outlined text-lg md:text-2xl">graphic_eq</span> {t("create.voiceAuto")}
                                    </button>
                                    <button
                                        onClick={() => setVoice("male")}
                                        className={`flex-1 py-2.5 md:py-4 rounded-lg md:rounded-xl text-xs md:text-base font-bold transition-all flex items-center justify-center gap-1 md:gap-2 ${voice === "male" ? "bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                                    >
                                        <span className="material-symbols-outlined text-lg md:text-2xl">man</span> <span className="hidden sm:inline">{t("create.voiceMale")}</span><span className="sm:hidden">M</span>
                                    </button>
                                    <button
                                        onClick={() => setVoice("female")}
                                        className={`flex-1 py-2.5 md:py-4 rounded-lg md:rounded-xl text-xs md:text-base font-bold transition-all flex items-center justify-center gap-1 md:gap-2 ${voice === "female" ? "bg-pink-500/20 text-pink-400 border border-pink-500/50 shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                                    >
                                        <span className="material-symbols-outlined text-lg md:text-2xl">woman</span> <span className="hidden sm:inline">{t("create.voiceFemale")}</span><span className="sm:hidden">F</span>
                                    </button>
                                </div>
                            </div>

                            {/* Video Clip Toggle */}
                            <div className="w-full">
                                <label className="text-xs md:text-sm text-white/40 font-bold uppercase tracking-wider mb-2 md:mb-4 block">{t("create.videoLabel")}</label>
                                <button
                                    onClick={() => setGenerateVideo(!generateVideo)}
                                    className={`w-full flex items-center gap-3 md:gap-4 p-3 md:p-5 rounded-xl md:rounded-2xl border transition-all ${generateVideo ? "bg-primary/10 border-primary" : "bg-white/5 border-white/10 hover:border-white/20"}`}
                                >
                                    <div className={`p-2 md:p-3 rounded-lg md:rounded-xl ${generateVideo ? "bg-primary/20" : "bg-white/10"}`}>
                                        <Video className={`w-5 h-5 md:w-6 md:h-6 ${generateVideo ? "text-primary" : "text-white/60"}`} />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="font-bold text-xs md:text-sm">{generateVideo ? t("create.videoEnabled") : t("create.videoDisabled")}</p>
                                        <p className="text-white/40 text-[10px] md:text-xs mt-0.5 truncate">{t("create.videoDesc")}</p>
                                    </div>
                                    <div className={`w-11 h-6 md:w-12 md:h-7 rounded-full transition-colors relative shrink-0 ${generateVideo ? "bg-primary" : "bg-white/20"}`}>
                                        <div className={`absolute top-0.5 md:top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${generateVideo ? "translate-x-5 md:translate-x-6" : "translate-x-0.5 md:translate-x-1"}`} />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Confirmation */}
                {
                    step === 3 && (
                        <div className="space-y-5 md:space-y-8 animate-fade-in text-center">
                            <div className="flex flex-col items-center">
                                <h2 className="text-xl md:text-3xl font-bold mb-1">{t("create.summaryTitle")}</h2>
                                <p className="text-white/60 text-sm">{t("create.summarySubtitle")}</p>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-8 text-left max-w-5xl mx-auto shadow-2xl relative overflow-hidden">
                                <div className="relative z-10 flex gap-4 md:gap-6 items-start">
                                    <div className="w-14 h-14 md:w-24 md:h-24 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shrink-0">
                                        <Music2 className="w-7 h-7 md:w-10 md:h-10 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-3 md:mb-4">
                                            <div className="min-w-0">
                                                <p className="text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest mb-0.5">
                                                    {selectedStyle === "custom" ? t("create.customLabel") : (styles.find(s => s.id === selectedStyle)?.label || "Style")}
                                                </p>
                                                <h3 className="text-lg md:text-2xl font-bold truncate">{title || t("create.untitled")}</h3>
                                                {selectedStyle === "custom" && customStyleText && (
                                                    <p className="text-white/50 text-xs mt-1 italic truncate">&quot;{customStyleText}&quot;</p>
                                                )}
                                            </div>
                                            <button onClick={() => setStep(2)} className="text-white/40 hover:text-white transition-colors ml-2 shrink-0">
                                                <Edit className="w-4 h-4 md:w-5 md:h-5" />
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs font-medium">
                                                <Globe className="w-3 h-3 text-primary" />
                                                {language === "en" ? "English" : "Français"}
                                            </span>
                                            {audioBlob && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                                                    <Mic className="w-3 h-3" /> Audio
                                                </span>
                                            )}
                                            {generateVideo && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                                                    <Video className="w-3 h-3" /> Video
                                                </span>
                                            )}
                                        </div>

                                        {lyrics && (
                                            <div className="mt-3">
                                                <p className="text-white/60 text-xs line-clamp-2 italic">&quot;{lyrics.split('\n')[0]}...&quot;</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Cost & Balance */}
                            <div className="flex justify-center gap-3 md:gap-6 max-w-2xl mx-auto">
                                <div className="flex-1 bg-primary/10 border border-primary/30 rounded-xl p-3 md:p-4 text-center">
                                    <p className="text-primary text-[10px] md:text-xs font-bold uppercase tracking-wider mb-0.5">{t("create.costLabel")}</p>
                                    <p className="text-2xl md:text-3xl font-bold">{getCost()} <span className="text-xs md:text-sm font-medium text-white/60">Cr.</span></p>
                                </div>
                                <div className={`flex-1 rounded-xl p-3 md:p-4 text-center ${credits < getCost() ? "bg-red-500/10 border border-red-500/30" : "bg-white/5 border border-white/10"}`}>
                                    <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wider mb-0.5 ${credits < getCost() ? "text-red-400" : "text-white/40"}`}>{t("create.balanceLabel")}</p>
                                    <p className="text-2xl md:text-3xl font-bold">{credits} <span className="text-xs md:text-sm font-medium text-white/60">Cr.</span></p>
                                </div>
                            </div>

                            {/* Insufficient credits alert */}
                            {credits < getCost() && (
                                <div className="max-w-2xl mx-auto bg-red-500/10 border border-red-500/30 rounded-xl p-3 md:p-4 flex flex-col sm:flex-row items-center gap-2 md:gap-3">
                                    <div className="flex-1 text-center sm:text-left">
                                        <p className="text-red-400 font-bold text-sm">{t("create.insufficientCredits")}</p>
                                        <p className="text-white/50 text-xs mt-0.5">{t("create.missingCredits", { count: getCost() - credits })}</p>
                                    </div>
                                    <a
                                        href="/credits"
                                        className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2 rounded-full text-sm transition-colors whitespace-nowrap"
                                    >
                                        {t("create.buyAction")}
                                    </a>
                                </div>
                            )}
                        </div>
                    )
                }
            </div >

            {/* Sticky Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 md:static md:mt-8 bg-[#0a0a0a]/95 backdrop-blur-md md:bg-transparent md:backdrop-blur-none border-t border-white/10 px-4 py-3 md:px-0 md:py-0 md:pt-8 z-40">
                <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
                    <button
                        onClick={() => step > 1 && setStep(step - 1)}
                        disabled={step === 1}
                        className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 h-10 md:h-12 rounded-lg border border-white/10 text-white/60 text-sm md:text-base font-bold hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden sm:inline">{t("common.back")}</span>
                    </button>

                    {
                        step === 3 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={loading || (credits < getCost())}
                                className="flex items-center gap-2 px-6 md:px-10 h-11 md:h-14 rounded-full bg-gradient-to-r from-primary to-[#FFD700] text-black font-bold text-sm md:text-lg hover:shadow-[0_0_30px_rgba(127,19,236,0.4)] transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                                        <span className="hidden sm:inline">{t("create.generating")}</span>
                                        <span className="sm:hidden">...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 md:w-5 md:h-5 fill-black" />
                                        {t("create.generateBtn", { cost: getCost() })}
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleNextStep}
                                disabled={(step === 1 && (!selectedStyle || (selectedStyle === "custom" && !customStyleText.trim()))) || (step === 2 && ((mode === "text" && !lyrics && !audioBlob) || (mode === "idea" && !lyrics && !audioBlob)))}
                                className="flex items-center gap-1.5 md:gap-2 px-6 md:px-8 h-10 md:h-12 rounded-full bg-primary text-white text-sm md:text-base font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/5"
                            >
                                {t("common.next")}
                                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        )
                    }
                </div>
            </div>
        </div>
    );
}
