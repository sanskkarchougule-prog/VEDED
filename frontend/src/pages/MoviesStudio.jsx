import React, { useEffect, useState } from "react";
import GenerationStudio from "@/components/GenerationStudio";
import { api } from "@/lib/api";
import { Clapperboard, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

const MODELS = [
    { id: "veded-compiler-v1", label: "VEDED Compiler v1", badge: "STUDIO", description: "Script → scenes → parallel render → FFmpeg stitch" },
    { id: "veded-compiler-4k", label: "VEDED Compiler 4K", badge: "4K", description: "Uncompressed 4K master · Dolby Atmos" },
];
const TOGGLES = [
    { id: "auto_dub", label: "Auto-Dub (Sarvam)", default: true },
    { id: "burn_captions", label: "Burn Captions" },
    { id: "crossfade", label: "Crossfade Scenes", default: true },
    { id: "color_grade", label: "Color Grade" },
];
const STYLES = [
    { id: "epic-fantasy", label: "Epic Fantasy", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600" },
    { id: "noir-thriller", label: "Noir Thriller", image: "https://images.unsplash.com/photo-1478720568477-b0829d60d9f6?w=600" },
    { id: "documentary", label: "Documentary", image: "https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=600" },
];
const RATIOS = [
    { id: "16:9", label: "16:9" },
    { id: "21:9", label: "21:9 Cinema" },
    { id: "4:3", label: "4:3 Classic" },
];

export default function MoviesStudio() {
    const { user } = useAuth();
    const nav = useNavigate();
    const [creations, setCreations] = useState([]);

    const isTeam = user?.veded_tier === "veded_team";

    useEffect(() => { api.get("/veded/creations").then((r) => setCreations((r.data.items || []).filter(c => c.type === "movie"))); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const onCreate = (c) => setCreations([c, ...creations]);
    const onDelete = async (id) => { await api.delete(`/veded/creations/${id}`); setCreations(creations.filter(c => c.id !== id)); };

    if (!isTeam) {
        return (
            <div className="max-w-3xl mx-auto py-16">
                <div className="v-card p-10 text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--v-surface-3)] border border-[var(--v-border)] flex items-center justify-center mb-6">
                        <Lock size={26} className="text-[var(--v-lime)]" />
                    </div>
                    <div className="v-chip v-chip-lime mb-4">TEAM / STUDIO EXCLUSIVE</div>
                    <h1 className="font-display-tight font-black text-4xl">Long-Format Movie Compiler</h1>
                    <p className="text-neutral-400 mt-3 max-w-lg mx-auto">
                        Automatic 30–60 minute video/audio concatenation pipeline. Script segmenter, parallel Higgsfield dispatcher, Sarvam AI dubbing, FFmpeg stitching with crossfade transitions.
                    </p>
                    <button onClick={() => nav("/app/pricing")} className="v-btn v-btn-lime mt-6" data-testid="movies-upgrade">
                        Upgrade to Studio · $199/mo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <GenerationStudio
            kind="movie"
            title="Feature Film"
            subtitle="Long-format movie compiler. 30–60 minute cinematic exports with automated stitching."
            placeholder="Paste your full script or high-level narrative. VEDED will segment scenes, dispatch parallel renders, dub in your chosen language and stitch a final cut."
            models={MODELS}
            toggles={TOGGLES}
            stylePresets={STYLES}
            aspectRatios={RATIOS}
            creations={creations}
            onCreate={onCreate}
            onDelete={onDelete}
            accentIcon={Clapperboard}
            uploadHint="Upload full script (.txt, .pdf)"
            uploadAccept=".txt,.pdf,.md,.docx"
            testIdPrefix="movies"
        />
    );
}
