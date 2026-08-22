import React, { useEffect, useState } from "react";
import GenerationStudio from "@/components/GenerationStudio";
import { api } from "@/lib/api";
import { Zap } from "lucide-react";

const MODELS = [
    { id: "flux-schnell", label: "FLUX Schnell", badge: "FAST", description: "4-step diffusion · ~4s render · ideal for iteration" },
    { id: "sdxl-turbo", label: "SDXL Turbo", badge: "PRO", description: "Photoreal fidelity · larger detail budget" },
    { id: "flux-1.1-ultra", label: "FLUX 1.1 Ultra", badge: "4K", description: "Best-in-class — 4K native, 40s render" },
];
const TOGGLES = [
    { id: "upscale", label: "AI Upscaling", default: true },
    { id: "denoise", label: "Neural Denoise" },
    { id: "color_match", label: "Color Match", default: true },
];
const STYLES = [
    { id: "photorealistic", label: "Photorealistic", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600" },
    { id: "cyberpunk", label: "Cyberpunk", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600" },
    { id: "anime", label: "Anime", image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600" },
];
const RATIOS = [
    { id: "16:9", label: "16:9 Cinema" },
    { id: "9:16", label: "9:16 Mobile" },
    { id: "1:1", label: "1:1 Square" },
    { id: "4:3", label: "4:3 Desktop" },
];

export default function ImagesStudio() {
    const [creations, setCreations] = useState([]);
    useEffect(() => { api.get("/veded/creations").then((r) => setCreations((r.data.items || []).filter(c => c.type === "image"))); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const onCreate = (c) => setCreations([c, ...creations]);
    const onDelete = async (id) => { await api.delete(`/veded/creations/${id}`); setCreations(creations.filter(c => c.id !== id)); };
    return (
        <GenerationStudio
            kind="image"
            title="Images Studio"
            subtitle="Neural rendering. Prompt-first. Photorealistic to anime — one engine."
            placeholder="Describe your creative vision… e.g., 'Futuristic organic architecture in a bioluminescent jungle, cinematic lighting, 8k'"
            models={MODELS}
            toggles={TOGGLES}
            stylePresets={STYLES}
            aspectRatios={RATIOS}
            creations={creations}
            onCreate={onCreate}
            onDelete={onDelete}
            accentIcon={Zap}
            uploadHint="Reference image"
            uploadAccept="image/*"
            testIdPrefix="images"
        />
    );
}
