import React, { useEffect, useState } from "react";
import GenerationStudio from "@/components/GenerationStudio";
import { api } from "@/lib/api";
import { Mic } from "lucide-react";

const MODELS = [
    { id: "sarvam-bulbul-v3", label: "Sarvam Bulbul v3", badge: "INDIC", description: "10+ Indian languages · low-latency TTS" },
    { id: "sarvam-manisha", label: "Sarvam Manisha", badge: "VOICE", description: "Neural voice cloning from 30s of reference" },
    { id: "elevenlabs-multi", label: "ElevenLabs Multilingual", badge: "GLOBAL", description: "Broadcast quality · 29 languages" },
];
const TOGGLES = [
    { id: "voice_clone", label: "Voice Clone" },
    { id: "midi_mode", label: "MIDI Mode" },
    { id: "master_eq", label: "Master EQ", default: true },
];
const STYLES = [
    { id: "ambient-drones", label: "Ambient Drones", image: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=600" },
    { id: "cinematic-score", label: "Cinematic Score", image: "https://images.unsplash.com/photo-1478720568477-b0829d60d9f6?w=600" },
    { id: "hindi-voiceover", label: "Hindi Voiceover", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600" },
];

export default function AudioLab() {
    const [creations, setCreations] = useState([]);
    useEffect(() => { api.get("/veded/creations").then((r) => setCreations((r.data.items || []).filter(c => c.type === "audio"))); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const onCreate = (c) => setCreations([c, ...creations]);
    const onDelete = async (id) => { await api.delete(`/veded/creations/${id}`); setCreations(creations.filter(c => c.id !== id)); };
    return (
        <GenerationStudio
            kind="audio"
            title="Audio Lab"
            subtitle="Sarvam Bulbul v3 · Indian regional voices · low-latency TTS + dubbing."
            placeholder="Describe the sound, mood, or instrument… e.g., 'Cinematic ambient texture with deep analog sub-bass and ethereal crystal-like plucks'"
            models={MODELS}
            toggles={TOGGLES}
            stylePresets={STYLES}
            aspectRatios={[]}
            creations={creations}
            onCreate={onCreate}
            onDelete={onDelete}
            accentIcon={Mic}
            uploadHint="Voice reference sample"
            uploadAccept="audio/*"
            testIdPrefix="audio"
        />
    );
}
