import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Video, Mic, Image as ImageIcon, Clapperboard, Monitor, ArrowRight, Cpu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const STUDIOS = [
    { key: "video", title: "Video Studio", icon: Video, to: "/app/video", accent: "3 RENDERS ACTIVE" },
    { key: "images", title: "Image Forge", icon: ImageIcon, to: "/app/images", accent: "IDLE" },
    { key: "audio", title: "Audio Lab", icon: Mic, to: "/app/audio", accent: "1 MASTERING" },
    { key: "movies", title: "Feature Film", icon: Clapperboard, to: "/app/movies", accent: "QUEUE EMPTY" },
    { key: "webseries", title: "Web Series", icon: Monitor, to: "/app/web-series", accent: "IDLE" },
];

export default function Dashboard() {
    const { user } = useAuth();
    const nav = useNavigate();
    const [creations, setCreations] = useState([]);
    const [prompt, setPrompt] = useState("");

    useEffect(() => {
        api.get("/veded/creations").then((r) => setCreations(r.data.items || [])).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const wallet = user?.wallet || {};
    const totalCredits = (wallet.image_credits || 0) + (wallet.video_credits || 0);

    return (
        <div className="space-y-10">
            {/* Hero card */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--v-border)] bg-gradient-to-br from-[var(--v-surface-2)] to-[var(--v-surface)] p-8 lg:p-12">
                <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[var(--v-lime)] opacity-[0.06] blur-3xl" />
                <div className="relative">
                    <div className="text-xs font-bold tracking-[0.3em] text-neutral-500">WELCOME BACK,</div>
                    <h1 className="font-display-tight font-black text-5xl lg:text-6xl mt-2 text-[var(--v-lime)]" data-testid="dashboard-hero">
                        {user?.name || "Artist"}.
                    </h1>
                    <p className="text-neutral-400 mt-3 max-w-xl">Your creative engine is primed. Resume your latest masterpiece or initiate a new project from our AI-powered studios.</p>

                    <div className="mt-8 relative max-w-3xl">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--v-lime)]/10 flex items-center justify-center">
                            <Sparkles size={14} className="text-[var(--v-lime)]" />
                        </div>
                        <input
                            data-testid="dashboard-quick-prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && prompt.trim()) {
                                    localStorage.setItem("veded_prefill", prompt);
                                    nav("/app/images");
                                }
                            }}
                            placeholder="Generate anything… (e.g. 'Cinematic landscape of Mars')"
                            className="w-full bg-black/40 border border-[var(--v-border-2)] rounded-2xl pl-14 pr-24 py-4 text-neutral-200 placeholder:text-neutral-500 focus:border-[var(--v-lime)] focus:outline-none text-[15px]"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 v-chip text-[10px]">⌘K</div>
                    </div>
                </div>
            </div>

            {/* Wallet strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <WalletTile label="IMAGE" value={wallet.image_credits || 0} testId="wallet-image" />
                <WalletTile label="VIDEO" value={wallet.video_credits || 0} testId="wallet-video" />
                <WalletTile label="AUDIO CHARS" value={(wallet.audio_chars || 0).toLocaleString()} testId="wallet-audio" />
                <WalletTile label="DUBBING" value={wallet.dubbing_credits || 0} testId="wallet-dubbing" />
                <WalletTile label="TOPUP $" value={`$${(wallet.cash_balance || 0).toFixed(2)}`} testId="wallet-cash" />
            </div>

            {/* Studios */}
            <div>
                <div className="flex items-end justify-between mb-4">
                    <h2 className="font-display-tight font-black text-3xl">Creative Studios</h2>
                    <button onClick={() => nav("/app/pricing")} className="text-[var(--v-lime)] text-sm font-semibold flex items-center gap-1" data-testid="dashboard-viewall">
                        View All <ArrowRight size={14} />
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {STUDIOS.map((s) => (
                        <button
                            key={s.key}
                            onClick={() => nav(s.to)}
                            className="v-card v-card-hoverlift p-5 text-left group"
                            data-testid={`dashboard-studio-${s.key}`}
                        >
                            <div className="w-12 h-12 rounded-xl bg-[var(--v-surface-3)] border border-[var(--v-border)] flex items-center justify-center mb-3 group-hover:border-[var(--v-lime)] transition-colors">
                                <s.icon size={20} className="text-[var(--v-lime)]" />
                            </div>
                            <div className="font-display font-bold text-[15px]">{s.title}</div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--v-lime)] v-pulse-dot" />
                                <div className="text-[10px] font-bold tracking-[0.2em] text-neutral-400">{s.accent}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent + Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                <div>
                    <h2 className="font-display-tight font-black text-3xl mb-4">Recent Projects</h2>
                    {creations.length === 0 ? (
                        <div className="v-card p-10 text-center text-neutral-500 text-sm">
                            No recent projects yet — spin up your first render from any studio.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {creations.slice(0, 4).map((c) => (
                                <div key={c.id} className="v-card v-card-hoverlift overflow-hidden" data-testid={`recent-${c.id}`}>
                                    <div className="aspect-video bg-black overflow-hidden">
                                        <RecentThumb c={c} />
                                    </div>
                                    <div className="p-3">
                                        <div className="text-[13px] line-clamp-1">{c.prompt}</div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="v-chip v-chip-lime text-[9px]">{c.type}</span>
                                            <span className="text-[10px] text-neutral-500">{new Date(c.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="font-display-tight font-black text-3xl mb-4">Engine</h2>
                    <div className="v-card p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--v-lime)] v-pulse-dot" />
                            <span className="font-display font-bold text-sm">AI ENGINE ONLINE</span>
                        </div>
                        <StatRow label="GPU Acceleration" value="98% Active" />
                        <StatRow label="Neural Cache" value="12.4 GB / 32 GB" />
                        <StatRow label="Server Location" value="Tokyo · JP" />
                        <StatRow label="Total Credits" value={totalCredits.toLocaleString()} />
                        <button onClick={() => nav("/app/pricing")} className="v-btn v-btn-ghost w-full text-[12px]" data-testid="engine-upgrade">
                            <Cpu size={13} /> Upgrade for 4K
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RecentThumb({ c }) {
    if (c.type === "video" || c.type === "movie") {
        return <video src={c.output_url} muted loop autoPlay playsInline className="w-full h-full object-cover" />;
    }
    if (c.type === "audio") {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--v-surface-3)] to-black">
                <Mic size={44} className="text-[var(--v-lime)]" />
            </div>
        );
    }
    return <img src={c.output_url} alt="" className="w-full h-full object-cover" />;
}

function WalletTile({ label, value, testId }) {
    return (
        <div className="v-card p-4" data-testid={testId}>
            <div className="text-[10px] font-bold tracking-[0.25em] text-neutral-500">{label}</div>
            <div className="font-display-tight font-black text-2xl mt-1 text-[var(--v-lime)] tabular-nums">{value}</div>
        </div>
    );
}
function StatRow({ label, value }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-400">{label}</span>
            <span className="font-display font-bold text-[var(--v-lime)]">{value}</span>
        </div>
    );
}
