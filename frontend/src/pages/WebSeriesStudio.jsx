import React, { useEffect, useState } from "react";
import GenerationStudio from "@/components/GenerationStudio";
import { api } from "@/lib/api";
import { Monitor, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

const MODELS = [
    { id: "veded-series-v1", label: "VEDED Series v1", badge: "PRO", description: "Episode planner + cast bibles for consistency" },
    { id: "veded-series-4k", label: "VEDED Series 4K", badge: "STUDIO", description: "4K per-episode with Sarvam dub tracks" },
];
const TOGGLES = [
    { id: "cast_bible", label: "Cast Bible", default: true },
    { id: "auto_dub", label: "Auto-Dub" },
    { id: "recap_intro", label: "Recap Intro" },
    { id: "crossfade", label: "Scene Crossfade", default: true },
];
const STYLES = [
    { id: "sci-fi-epic", label: "Sci-Fi Epic", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600" },
    { id: "dark-fantasy", label: "Dark Fantasy", image: "https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=600" },
    { id: "slice-of-life", label: "Slice of Life", image: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=600" },
];
const RATIOS = [
    { id: "16:9", label: "16:9" },
    { id: "21:9", label: "21:9" },
];

export default function WebSeriesStudio() {
    const { user } = useAuth();
    const nav = useNavigate();
    const [creations, setCreations] = useState([]);

    // Gate: Series, Pro or Team tier
    const tier = user?.veded_tier || "free";
    const canAccess = tier === "veded_series" || tier === "veded_pro" || tier === "veded_team";

    useEffect(() => { api.get("/veded/creations").then((r) => setCreations((r.data.items || []).filter(c => c.type === "video"))); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const onCreate = (c) => setCreations([c, ...creations]);
    const onDelete = async (id) => { await api.delete(`/veded/creations/${id}`); setCreations(creations.filter(c => c.id !== id)); };

    if (!canAccess) {
        return (
            <div className="max-w-3xl mx-auto py-16">
                <div className="v-card p-10 text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--v-surface-3)] border border-[var(--v-border)] flex items-center justify-center mb-6">
                        <Lock size={26} className="text-[var(--v-lime)]" />
                    </div>
                    <div className="v-chip v-chip-lime mb-4">SERIES / PRO / STUDIO EXCLUSIVE</div>
                    <h1 className="font-display-tight font-black text-4xl">Web Series Studio</h1>
                    <p className="text-neutral-400 mt-3 max-w-lg mx-auto">
                        Season planner with per-character cast bibles for visual consistency across episodes. Multi-episode dispatch with automatic recap intros and Sarvam dubbing.
                    </p>
                    <button onClick={() => nav("/app/pricing")} className="v-btn v-btn-lime mt-6" data-testid="webseries-upgrade">
                        Upgrade to Web Series · $119/mo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <GenerationStudio
            kind="video"
            title="Web Series"
            subtitle="Episode planner + cast bibles for character consistency across a season."
            placeholder="Describe your episode… e.g., 'Ep 2: The Archivist enters the neon vault. Reveal the missing codex.'"
            models={MODELS}
            toggles={TOGGLES}
            stylePresets={STYLES}
            aspectRatios={RATIOS}
            creations={creations}
            onCreate={onCreate}
            onDelete={onDelete}
            accentIcon={Monitor}
            uploadHint="Cast bible / episode brief"
            uploadAccept=".txt,.pdf,.md,.docx,image/*"
            testIdPrefix="webseries"
        />
    );
}
