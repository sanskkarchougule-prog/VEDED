import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Play, Pause, Languages, Sparkles, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth, getDeviceFingerprint } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BookStreamDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const { user, refresh } = useAuth();
    const [content, setContent] = useState(null);
    const [languages, setLanguages] = useState([]);
    const [selectedLang, setSelectedLang] = useState("hi");
    const [dubbing, setDubbing] = useState(false);
    const [track, setTrack] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [trialActive, setTrialActive] = useState(false);

    useEffect(() => {
        api.get(`/bookstream/content/${id}`).then((r) => setContent(r.data)).catch(() => nav("/app/bookstream"));
        api.get(`/bookstream/languages`).then((r) => setLanguages(r.data.items || []));
    }, [id, nav]);

    const startTrial = async () => {
        try {
            const fp = getDeviceFingerprint();
            const { data } = await api.post("/bookstream/trial", { content_id: id, device_fingerprint: fp });
            setTrialActive(true);
            refresh();
            toast.success(`Free trial granted · preview ${data.preview_seconds}s`);
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Trial unavailable");
        }
    };

    const dub = async () => {
        setDubbing(true);
        try {
            const { data } = await api.post("/bookstream/dub", { content_id: id, language: selectedLang });
            setTrack(data.track);
            refresh();
            toast.success(`Dubbed in ${data.track.language_name}`);
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Dubbing failed");
        } finally {
            setDubbing(false);
        }
    };

    if (!content) return <div className="p-8 text-neutral-500">Loading…</div>;

    const canPlay = user?.bookstream_tier || trialActive || user?.trial_used;
    const trialAvailable = !user?.trial_used;

    return (
        <div className="space-y-8">
            <button onClick={() => nav(-1)} className="flex items-center gap-1 text-neutral-400 hover:text-[var(--v-lime)] text-sm" data-testid="bs-back">
                <ArrowLeft size={14} /> Back
            </button>

            {/* Cinematic hero */}
            <div className="relative rounded-2xl overflow-hidden border border-[var(--v-border)] aspect-[21/9]">
                <img src={content.cover} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-3xl">
                    <div className="v-chip v-chip-lime mb-3">{content.genre?.toUpperCase()}</div>
                    <h1 className="font-display-tight font-black text-4xl md:text-6xl text-white leading-none" data-testid="bs-detail-title">{content.title}</h1>
                    <p className="mt-3 text-neutral-300 max-w-xl">{content.description}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-neutral-400">
                        <span>{content.creator}</span> · <span>{content.duration}</span> · <span>{content.views} views</span>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                        {(() => {
                            if (canPlay) {
                                let playLabel = "Play";
                                if (playing) playLabel = "Pause";
                                else if (trialActive) playLabel = "Play Free Preview";
                                return (
                                    <button
                                        data-testid="bs-play"
                                        onClick={() => setPlaying(!playing)}
                                        className="v-btn v-btn-lime px-6 py-3"
                                    >
                                        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                        {playLabel}
                                    </button>
                                );
                            }
                            if (trialAvailable) {
                                return (
                                    <button
                                        data-testid="bs-trial"
                                        onClick={startTrial}
                                        className="v-btn v-btn-lime px-6 py-3"
                                    >
                                        <Sparkles size={15} /> Start 1-video free trial
                                    </button>
                                );
                            }
                            return (
                                <button
                                    data-testid="bs-subscribe"
                                    onClick={() => nav("/app/pricing")}
                                    className="v-btn v-btn-lime px-6 py-3"
                                >
                                    Subscribe to Watch
                                </button>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Player mock */}
            {playing && (
                <div className="v-card p-6" data-testid="bs-player">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                        <img src={content.cover} alt="" className="w-full h-full object-cover opacity-70" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-[var(--v-lime)]/20 border-2 border-[var(--v-lime)] flex items-center justify-center v-shimmer">
                                <div className="w-2 h-8 bg-[var(--v-lime)] mx-0.5" />
                                <div className="w-2 h-8 bg-[var(--v-lime)] mx-0.5" />
                            </div>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full w-1/3 bg-[var(--v-lime)]" />
                            </div>
                        </div>
                    </div>
                    {track?.dubbed_audio_url && (
                        <audio src={track.dubbed_audio_url} controls className="w-full mt-4" />
                    )}
                </div>
            )}

            {/* Dubbing panel */}
            <div className="v-card p-6" data-testid="bs-dub-panel">
                <div className="flex items-center gap-2 mb-4">
                    <Languages size={16} className="text-[var(--v-lime)]" />
                    <h2 className="font-display font-bold text-lg">On-demand Dubbing</h2>
                    <span className="ml-auto v-chip">Powered by Sarvam Bulbul v3</span>
                </div>
                <p className="text-sm text-neutral-400 mb-4">Uses 5 dubbing credits. You have <span className="text-[var(--v-lime)] font-semibold">{user?.wallet?.dubbing_credits || 0}</span> remaining.</p>
                <div className="flex flex-wrap gap-3">
                    <Select value={selectedLang} onValueChange={setSelectedLang}>
                        <SelectTrigger className="w-64 bg-[var(--v-surface-2)] border-[var(--v-border)]" data-testid="bs-lang-select">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--v-surface-2)] border-[var(--v-border)]">
                            {languages.map((l) => (
                                <SelectItem key={l.code} value={l.code} data-testid={`bs-lang-${l.code}`}>
                                    {l.name} · {l.accent}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <button onClick={dub} disabled={dubbing} className="v-btn v-btn-lime disabled:opacity-60" data-testid="bs-dub-btn">
                        {dubbing ? "Dubbing…" : "Dub this title"}
                    </button>
                </div>
                {track && (
                    <div className="mt-6 p-4 rounded-xl bg-[var(--v-surface-2)] border border-[var(--v-border-2)]">
                        <div className="text-xs text-neutral-400 mb-2">Dub ready · {track.language_name}</div>
                        <audio src={track.dubbed_audio_url} controls className="w-full" />
                    </div>
                )}
            </div>
        </div>
    );
}
