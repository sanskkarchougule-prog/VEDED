import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { Sparkles, Play, Download, Trash2, Paperclip, ChevronDown, Cpu, X, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const ETA_BY_KIND = { video: "28s", audio: "8s", movie: "4m", image: "4.2s" };

/**
 * Props:
 *  - kind: "image" | "video" | "audio" | "movie"
 *  - title, subtitle, placeholder
 *  - models: [{ id, label, badge?, description? }]
 *  - toggles: [{ id, label, default? }]
 *  - stylePresets, aspectRatios, creations
 *  - uploadHint: string  (e.g. "Reference image", "Voice sample")
 *  - uploadAccept: "image/*" | "audio/*" | "*"
 *  - onCreate, onDelete
 */
export default function GenerationStudio({
    kind,
    title,
    subtitle,
    placeholder,
    models = [],
    toggles = [],
    stylePresets = [],
    aspectRatios = [],
    creations = [],
    uploadHint = "Reference file",
    uploadAccept = "*",
    onCreate,
    onDelete,
    accentIcon: Icon = Sparkles,
    testIdPrefix = "gen",
}) {
    const { refresh } = useAuth();
    const [prompt, setPrompt] = useState("");
    const [style, setStyle] = useState(stylePresets[0]?.id || "");
    const [aspect, setAspect] = useState(aspectRatios[0]?.id || "16:9");
    const [model, setModel] = useState(models[0]?.id || "");
    const [toggleState, setToggleState] = useState(
        Object.fromEntries(toggles.map((t) => [t.id, !!t.default]))
    );
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInput = useRef(null);

    const currentModel = models.find((m) => m.id === model) || models[0];

    const generate = async () => {
        if (!prompt.trim()) { toast.error("Add a prompt to describe your vision"); return; }
        setLoading(true);
        try {
            const { data } = await api.post("/veded/generate", {
                kind, prompt, style, aspect_ratio: aspect, model,
                options: { ...toggleState, reference_file: file?.name || null },
            });
            toast.success(`${kind.charAt(0).toUpperCase() + kind.slice(1)} rendered`, { description: "Your creation is ready." });
            onCreate && onCreate(data.creation);
            refresh();
            setPrompt("");
        } catch (e) {
            const msg = e?.response?.data?.detail || "Generation failed";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 data-testid={`${testIdPrefix}-title`} className="font-display-tight font-black text-4xl lg:text-5xl text-[var(--v-lime)]">{title}</h1>
                {subtitle && <p className="text-neutral-400 mt-2 text-[15px] max-w-2xl">{subtitle}</p>}
            </div>

            {/* Prompt card with integrated options + compact Generate */}
            <div className="v-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Icon size={16} className="text-[var(--v-lime)]" />
                    <span className="font-display font-semibold text-[11px] tracking-[0.25em] text-neutral-400">NEURAL PROMPT INTERFACE</span>
                    {currentModel?.badge && (
                        <span className="v-chip v-chip-lime text-[9px] ml-auto">{currentModel.badge}</span>
                    )}
                </div>
                <Textarea
                    data-testid={`${testIdPrefix}-prompt`}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={placeholder}
                    rows={4}
                    className="w-full bg-black/40 border-[var(--v-border)] text-neutral-200 placeholder:text-neutral-600 resize-none focus:border-[var(--v-lime)] rounded-lg text-[15px] leading-relaxed"
                />

                {/* Options row */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                    {/* Model selector */}
                    {models.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    data-testid={`${testIdPrefix}-model-trigger`}
                                    className="inline-flex items-center gap-2 px-3 h-9 rounded-full border border-[var(--v-border)] bg-[var(--v-surface-2)] hover:border-[var(--v-lime)] text-[12px] text-neutral-200 transition-colors"
                                >
                                    <Cpu size={13} className="text-[var(--v-lime)]" />
                                    <span className="font-semibold">{currentModel?.label || "Model"}</span>
                                    <ChevronDown size={12} className="text-neutral-500" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-[var(--v-surface-2)] border-[var(--v-border-2)] w-72">
                                <DropdownMenuLabel className="text-neutral-400 text-[10px] tracking-[0.2em] uppercase">AI Engine</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-[var(--v-border)]" />
                                {models.map((m) => (
                                    <DropdownMenuItem
                                        key={m.id}
                                        onClick={() => setModel(m.id)}
                                        data-testid={`${testIdPrefix}-model-${m.id}`}
                                        className="flex flex-col items-start gap-0.5"
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            <span className="font-semibold text-[13px] text-neutral-100">{m.label}</span>
                                            {m.badge && <span className="v-chip v-chip-lime text-[9px] ml-auto">{m.badge}</span>}
                                            {model === m.id && <Check size={12} className="text-[var(--v-lime)]" />}
                                        </div>
                                        {m.description && <div className="text-[11px] text-neutral-500">{m.description}</div>}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Upload / Reference */}
                    <input
                        ref={fileInput}
                        type="file"
                        accept={uploadAccept}
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        data-testid={`${testIdPrefix}-file-input`}
                    />
                    <button
                        onClick={() => fileInput.current?.click()}
                        data-testid={`${testIdPrefix}-upload-btn`}
                        className={`inline-flex items-center gap-2 px-3 h-9 rounded-full border text-[12px] transition-colors ${
                            file ? "border-[var(--v-lime)] bg-[rgba(195,244,0,0.08)] text-[var(--v-lime)]" : "border-[var(--v-border)] bg-[var(--v-surface-2)] text-neutral-300 hover:border-[var(--v-lime)]"
                        }`}
                    >
                        <Paperclip size={13} />
                        <span className="font-semibold truncate max-w-[140px]">{file ? file.name : uploadHint}</span>
                        {file && (
                            <X size={12} onClick={(ev) => { ev.stopPropagation(); setFile(null); if (fileInput.current) fileInput.current.value=""; }} className="text-neutral-400 hover:text-red-400" />
                        )}
                    </button>

                    {/* Toggles */}
                    {toggles.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setToggleState((s) => ({ ...s, [t.id]: !s[t.id] }))}
                            data-testid={`${testIdPrefix}-toggle-${t.id}`}
                            className={`inline-flex items-center gap-2 px-3 h-9 rounded-full border text-[12px] transition-colors ${
                                toggleState[t.id]
                                    ? "border-[var(--v-lime)] bg-[rgba(195,244,0,0.08)] text-[var(--v-lime)]"
                                    : "border-[var(--v-border)] bg-[var(--v-surface-2)] text-neutral-300 hover:border-[var(--v-border-2)]"
                            }`}
                        >
                            <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${toggleState[t.id] ? "bg-[var(--v-lime)] border-[var(--v-lime)]" : "border-[var(--v-border-2)]"}`}>
                                {toggleState[t.id] && <Check size={10} className="text-black" strokeWidth={4} />}
                            </span>
                            <span className="font-semibold">{t.label}</span>
                        </button>
                    ))}

                    <div className="flex-1" />

                    <div className="text-[11px] text-neutral-500 hidden sm:block">
                        <span className="tabular-nums">{prompt.length}/2000</span>
                        <span className="mx-2 text-neutral-700">·</span>
                        <span>~{ETA_BY_KIND[kind] || "5s"}</span>
                    </div>

                    <button
                        data-testid={`${testIdPrefix}-generate`}
                        disabled={loading}
                        onClick={generate}
                        className="v-btn v-btn-lime h-10 px-5 text-[12px] tracking-[0.08em] v-glow-lime disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                RENDERING
                            </>
                        ) : (
                            <>
                                <Sparkles size={14} strokeWidth={2.5} />
                                {kind === "movie" ? "COMPILE" : "GENERATE"}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Style + aspect */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {stylePresets.length > 0 && (
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-display font-bold text-lg">Style Presets</h3>
                            <span className="text-xs text-neutral-500">Pick a look</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {stylePresets.map((s) => (
                                <button
                                    key={s.id}
                                    data-testid={`${testIdPrefix}-style-${s.id}`}
                                    onClick={() => setStyle(s.id)}
                                    className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 group ${
                                        style === s.id ? "border-[var(--v-lime)] v-glow-lime" : "border-[var(--v-border)] hover:border-[var(--v-border-2)]"
                                    }`}
                                >
                                    <img src={s.image} alt={s.label} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute bottom-3 left-3 right-3 text-white font-semibold text-[13px]">{s.label}</div>
                                    {style === s.id && (
                                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--v-lime)] flex items-center justify-center text-black text-xs font-black">✓</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {aspectRatios.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-display font-bold text-lg">Aspect Ratio</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {aspectRatios.map((a) => (
                                <button
                                    key={a.id}
                                    data-testid={`${testIdPrefix}-aspect-${a.id.replace(":","-")}`}
                                    onClick={() => setAspect(a.id)}
                                    className={`aspect-[4/3] rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-colors ${
                                        aspect === a.id ? "border-[var(--v-lime)] bg-[rgba(195,244,0,0.05)]" : "border-[var(--v-border)] hover:border-[var(--v-border-2)]"
                                    }`}
                                >
                                    <div className="border-2 border-neutral-500" style={ratioStyle(a.id)} />
                                    <span className={`text-[12px] font-semibold ${aspect === a.id ? "text-[var(--v-lime)]" : "text-neutral-300"}`}>{a.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Gallery */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-display-tight font-black text-2xl">Recent {kind === "audio" ? "Generates" : "Gallery"}</h3>
                        <p className="text-sm text-neutral-500">{creations.length} assets</p>
                    </div>
                </div>
                {creations.length === 0 ? (
                    <div className="v-card p-12 text-center">
                        <div className="text-neutral-500 text-sm">No creations yet. Describe your vision above and hit {kind === "movie" ? "Compile" : "Generate"}.</div>
                    </div>
                ) : (
                    <div className={`grid gap-4 ${kind === "audio" ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"}`}>
                        {creations.map((c) => (
                            <CreationCard key={c.id} c={c} onDelete={onDelete} testIdPrefix={testIdPrefix} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ratioStyle(id) {
    if (id === "16:9") return { width: 36, height: 20 };
    if (id === "9:16") return { width: 20, height: 36 };
    if (id === "1:1") return { width: 30, height: 30 };
    if (id === "4:3") return { width: 36, height: 27 };
    if (id === "21:9") return { width: 42, height: 18 };
    return { width: 32, height: 22 };
}

function CreationCard({ c, onDelete, testIdPrefix }) {
    const [playing, setPlaying] = useState(false);
    if (c.type === "audio") {
        return (
            <div className="v-card p-4 flex items-center gap-4" data-testid={`${testIdPrefix}-card-${c.id}`}>
                <button
                    onClick={() => setPlaying(!playing)}
                    className="w-11 h-11 rounded-full bg-[var(--v-lime)] flex items-center justify-center text-black shrink-0"
                    data-testid={`${testIdPrefix}-play-${c.id}`}
                >
                    <Play size={16} fill="currentColor" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{c.prompt.slice(0, 60)}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{new Date(c.created_at).toLocaleString()}</div>
                    {playing && (
                        <audio src={c.output_url} autoPlay controls className="w-full mt-2" onEnded={() => setPlaying(false)} />
                    )}
                </div>
                <button onClick={() => onDelete && onDelete(c.id)} className="p-2 text-neutral-500 hover:text-red-400" data-testid={`${testIdPrefix}-del-${c.id}`}><Trash2 size={14} /></button>
            </div>
        );
    }
    const isVideo = c.type === "video" || c.type === "movie";
    return (
        <div className="v-card v-card-hoverlift overflow-hidden group" data-testid={`${testIdPrefix}-card-${c.id}`}>
            <div className="aspect-video relative overflow-hidden bg-black">
                {isVideo ? (
                    <video src={c.output_url} poster="" muted loop playsInline
                           onMouseEnter={(e) => e.currentTarget.play()}
                           onMouseLeave={(e) => e.currentTarget.pause()}
                           className="w-full h-full object-cover" />
                ) : (
                    <img src={c.output_url} alt={c.prompt} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={c.output_url} download target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-[var(--v-lime)] hover:text-black" data-testid={`${testIdPrefix}-dl-${c.id}`}><Download size={13} /></a>
                    <button onClick={() => onDelete && onDelete(c.id)} className="w-8 h-8 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-500" data-testid={`${testIdPrefix}-del-${c.id}`}><Trash2 size={13} /></button>
                </div>
                <div className="absolute top-2 left-2 v-chip v-chip-lime text-[9px]">{c.type}</div>
            </div>
            <div className="p-3">
                <div className="text-[13px] text-neutral-200 line-clamp-2">{c.prompt}</div>
                <div className="text-[10px] text-neutral-500 mt-1">{new Date(c.created_at).toLocaleDateString()}</div>
            </div>
        </div>
    );
}
