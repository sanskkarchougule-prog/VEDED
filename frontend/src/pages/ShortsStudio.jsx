import React, { useEffect, useState } from "react";
import GenerationStudio from "@/components/GenerationStudio";
import { api } from "@/lib/api";
import { Zap } from "lucide-react";

const MODELS = [
    { id: "higgsfield-shorts", label: "Higgsfield Shorts", badge: "9:16", description: "Vertical-optimized · trending motion presets" },
    { id: "higgsfield-viral", label: "Viral Motion", badge: "TREND", description: "Punchy cuts + captions burn-in" },
];
const TOGGLES = [
    { id: "auto_captions", label: "Auto Captions", default: true },
    { id: "beat_sync", label: "Beat Sync" },
    { id: "hook_intro", label: "Hook Intro", default: true },
];
const STYLES = [
    { id: "product-hype", label: "Product Hype", image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600" },
    { id: "lifestyle", label: "Lifestyle", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600" },
    { id: "trending-tiktok", label: "Trending", image: "https://images.unsplash.com/photo-1478720568477-b0829d60d9f6?w=600" },
];
const RATIOS = [
    { id: "9:16", label: "9:16" },
    { id: "1:1", label: "1:1" },
];

export default function ShortsStudio() {
    const [creations, setCreations] = useState([]);
    useEffect(() => { api.get("/veded/creations").then((r) => setCreations((r.data.items || []).filter(c => c.type === "video"))); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const onCreate = (c) => setCreations([c, ...creations]);
    const onDelete = async (id) => { await api.delete(`/veded/creations/${id}`); setCreations(creations.filter(c => c.id !== id)); };
    return (
        <GenerationStudio
            kind="video"
            title="Shorts Studio"
            subtitle="9:16 vertical viral clips optimized for reels, shorts & TikTok."
            placeholder="A close-up of a matcha latte being poured in ultra slow-mo, neon-lit café at night, 9:16…"
            models={MODELS}
            toggles={TOGGLES}
            stylePresets={STYLES}
            aspectRatios={RATIOS}
            creations={creations}
            onCreate={onCreate}
            onDelete={onDelete}
            accentIcon={Zap}
            uploadHint="Reference clip"
            uploadAccept="image/*,video/*"
            testIdPrefix="shorts"
        />
    );
}
