import React, { useEffect, useState } from "react";
import GenerationStudio from "@/components/GenerationStudio";
import { api } from "@/lib/api";
import { Video } from "lucide-react";

const MODELS = [
    { id: "higgsfield-i2v", label: "Higgsfield Image-to-Video", badge: "STABLE", description: "5s clips from a still frame · smooth motion" },
    { id: "higgsfield-cinematic", label: "Cinematic Motion", badge: "PRO", description: "Dramatic camera work · dolly + parallax" },
    { id: "runway-gen3", label: "Runway Gen-3", badge: "4K", description: "Highest fidelity · 4K prores export" },
];
const TOGGLES = [
    { id: "seamless_loop", label: "Seamless Loop", default: true },
    { id: "motion_blur", label: "Motion Blur" },
    { id: "depth_aware", label: "Depth Aware" },
];
const STYLES = [
    { id: "cyberpunk-urban", label: "Cyberpunk Urban", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600" },
    { id: "liquid-abstract", label: "Liquid Abstract", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600" },
    { id: "product-closeup", label: "Product Close-up", image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600" },
];
const RATIOS = [
    { id: "9:16", label: "9:16" },
    { id: "16:9", label: "16:9" },
    { id: "1:1", label: "1:1" },
    { id: "21:9", label: "21:9" },
];

export default function VideoStudio() {
    const [creations, setCreations] = useState([]);
    useEffect(() => { api.get("/veded/creations").then((r) => setCreations((r.data.items || []).filter(c => c.type === "video"))); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const onCreate = (c) => setCreations([c, ...creations]);
    const onDelete = async (id) => { await api.delete(`/veded/creations/${id}`); setCreations(creations.filter(c => c.id !== id)); };
    return (
        <GenerationStudio
            kind="video"
            title="Video Studio"
            subtitle="Cinematic 5-second clips. Motion intensity 8.5/10. Ready for reels."
            placeholder="A cinematic macro shot of a sleek glass water bottle with condensation droplets, bathed in neon lime lights, high-speed 120fps motion…"
            models={MODELS}
            toggles={TOGGLES}
            stylePresets={STYLES}
            aspectRatios={RATIOS}
            creations={creations}
            onCreate={onCreate}
            onDelete={onDelete}
            accentIcon={Video}
            uploadHint="Reference frame / storyboard"
            uploadAccept="image/*,video/*"
            testIdPrefix="video"
        />
    );
}
