"use client";

import { useEffect, useState } from "react";
import { Play, Pause, Info } from "lucide-react";

interface Style {
    id: string;
    label: string;
    category: string;
    prompt_template_fr: string;
    bpm_range: number[];
    energy: string;
    instrumentation: string[];
}

export default function StylesPage() {
    const [styles, setStyles] = useState<Style[]>([]);
    const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
    const [playing, setPlaying] = useState<string | null>(null);

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

    const categories = [...new Set(styles.map(s => s.category))];

    const getCategoryLabel = (category: string): string => {
        const labels: Record<string, string> = {
            AFRICAN: "🌍 Styles Africains",
            URBAN: "🎤 Urbain",
            UNIVERSAL: "🌐 Universel"
        };
        return labels[category] || category;
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Styles Musicaux</h1>
                <p className="text-white/60 mt-1">
                    Découvrez notre collection de styles africains authentiques
                </p>
            </div>

            {/* Categories */}
            {categories.map((category) => (
                <div key={category} className="mb-12">
                    <h2 className="text-xl font-bold mb-6 text-[#FFD700]">
                        {getCategoryLabel(category)}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {styles
                            .filter((s) => s.category === category)
                            .map((style) => (
                                <div
                                    key={style.id}
                                    className="glass-card rounded-2xl p-6 hover:ring-1 hover:ring-primary/40 transition-all cursor-pointer"
                                    onClick={() => setSelectedStyle(style)}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-xl font-bold">{style.label}</h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPlaying(playing === style.id ? null : style.id);
                                            }}
                                            className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
                                        >
                                            {playing === style.id ? (
                                                <Pause className="w-5 h-5 text-primary" />
                                            ) : (
                                                <Play className="w-5 h-5 text-primary ml-0.5" />
                                            )}
                                        </button>
                                    </div>

                                    <p className="text-white/60 text-sm mb-4 line-clamp-2">
                                        {style.prompt_template_fr}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {style.bpm_range && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
                                                {style.bpm_range[0]}-{style.bpm_range[1]} BPM
                                            </span>
                                        )}
                                        {style.energy && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                                                {style.energy}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            ))}

            {/* Style Detail Modal */}
            {selectedStyle && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedStyle(null)}
                >
                    <div
                        className="glass-card rounded-2xl p-8 max-w-lg w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold mb-2">{selectedStyle.label}</h2>
                        <p className="text-[#FFD700] text-sm mb-6">{selectedStyle.category}</p>

                        <p className="text-white/80 mb-6">{selectedStyle.prompt_template_fr}</p>

                        {selectedStyle.instrumentation && (
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-white/60 mb-2">Instrumentation</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedStyle.instrumentation.map((inst, i) => (
                                        <span
                                            key={i}
                                            className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80"
                                        >
                                            {inst}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setSelectedStyle(null)}
                                className="flex-1 border border-white/10 hover:bg-white/5 text-white font-bold py-3 rounded-xl"
                            >
                                Fermer
                            </button>
                            <a
                                href={`/create?style=${selectedStyle.id}`}
                                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl text-center"
                            >
                                Créer avec ce style
                            </a>
                        </div>
                    </div>
                </div>
            )}

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
