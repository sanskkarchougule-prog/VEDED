import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, Trash2, Download } from "lucide-react";
import { api } from "@/lib/api";

export default function Search() {
    const [params] = useSearchParams();
    const nav = useNavigate();
    const q = params.get("q") || "";
    const [input, setInput] = useState(q);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setInput(q);
        if (!q.trim()) { setResults([]); return; }
        setLoading(true);
        api.get(`/veded/search?q=${encodeURIComponent(q)}`)
            .then(({ data }) => setResults(data.results || []))
            .catch(() => setResults([]))
            .finally(() => setLoading(false));
    }, [q]);

    const submit = (e) => {
        e.preventDefault();
        nav(`/app/search?q=${encodeURIComponent(input.trim())}`);
    };

    return (
        <div className="space-y-8" data-testid="search-page">
            <div>
                <h1 className="font-display-tight font-black text-4xl text-[var(--v-lime)]">Search</h1>
                <p className="text-neutral-400 mt-2 text-[15px]">Find your generated assets by prompt.</p>
            </div>

            <form onSubmit={submit} className="relative max-w-2xl">
                <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                    data-testid="search-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Search prompts, e.g. neon tiger…"
                    className="w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-full pl-11 pr-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-[var(--v-lime)] focus:outline-none"
                />
            </form>

            {loading ? (
                <div className="text-neutral-500 text-sm" data-testid="search-loading">Searching…</div>
            ) : q && results.length === 0 ? (
                <div className="v-card p-12 text-center text-neutral-500 text-sm" data-testid="search-empty">No creations match "{q}".</div>
            ) : (
                <>
                    {q && <p className="text-sm text-neutral-500" data-testid="search-count">{results.length} result{results.length === 1 ? "" : "s"} for "{q}"</p>}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {results.map((c) => {
                            const isVideo = c.type === "video" || c.type === "movie";
                            const isAudio = c.type === "audio";
                            return (
                                <div key={c.id} className="v-card v-card-hoverlift overflow-hidden group" data-testid={`search-result-${c.id}`}>
                                    <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center">
                                        {isVideo ? (
                                            <video src={c.output_url} muted loop playsInline className="w-full h-full object-cover" />
                                        ) : isAudio ? (
                                            <div className="text-neutral-500 text-xs px-3 text-center">🎵 audio</div>
                                        ) : (
                                            <img src={c.output_url} alt={c.prompt} className="w-full h-full object-cover" />
                                        )}
                                        <div className="absolute top-2 left-2 v-chip v-chip-lime text-[9px]">{c.type}</div>
                                    </div>
                                    <div className="p-3">
                                        <div className="text-[13px] text-neutral-200 line-clamp-2">{c.prompt}</div>
                                        <div className="text-[10px] text-neutral-500 mt-1">{new Date(c.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
