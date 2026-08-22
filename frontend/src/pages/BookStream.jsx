import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Play, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

const CHANNELS = [
    { name: "The Narrator X", subs: "2.4M", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200" },
    { name: "Phoenix Reads", subs: "890K", avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200" },
    { name: "Cyber Lore", subs: "1.1M", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200" },
    { name: "The Archivist", subs: "420K", avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200" },
];

export default function BookStream() {
    const nav = useNavigate();
    const [items, setItems] = useState([]);
    useEffect(() => { api.get("/bookstream/content").then((r) => setItems(r.data.items || [])); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const shorts = items.slice(0, 5);
    const trending = items.filter(c => c.type !== "audiobook").slice(0, 4);
    const recommended = items;

    return (
        <div className="space-y-12">
            {/* Broadcast banner */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--v-border)] p-8 lg:p-10" style={{
                background: "linear-gradient(135deg, rgba(195,244,0,0.14) 0%, rgba(20,20,20,0.6) 45%, rgba(20,20,20,0.9) 100%)"
            }}>
                <div className="max-w-2xl">
                    <div className="text-[10px] font-bold tracking-[0.3em] text-[var(--v-lime)] mb-2">READY TO BROADCAST?</div>
                    <h1 className="font-display-tight font-black text-3xl md:text-4xl">Upload your latest cinematic book production and reach millions of digital listeners.</h1>
                </div>
                <button className="v-btn v-btn-lime mt-6 text-[13px]" data-testid="bookstream-upload">
                    <Upload size={15} /> UPLOAD BOOK VIDEO
                </button>
            </div>

            {/* Book Shorts */}
            <Section title="Book Shorts" accent testIdSuffix="shorts">
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory">
                    {shorts.map((c) => (
                        <button key={c.id} onClick={() => nav(`/app/bookstream/${c.id}`)}
                            className="v-card v-card-hoverlift shrink-0 w-[220px] overflow-hidden text-left snap-start"
                            data-testid={`short-${c.id}`}>
                            <div className="aspect-[9/16] relative">
                                <img src={c.cover} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <div className="text-[9px] font-bold tracking-[0.25em] text-[var(--v-lime)]">{c.genre.toUpperCase()}</div>
                                    <div className="font-display font-bold text-white text-base leading-tight mt-1">{c.title}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </Section>

            {/* Trending */}
            <Section title="Trending Books" testIdSuffix="trending">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {trending.map((c) => (
                        <button key={c.id} onClick={() => nav(`/app/bookstream/${c.id}`)}
                            className="v-card v-card-hoverlift overflow-hidden text-left group"
                            data-testid={`trending-${c.id}`}>
                            <div className="aspect-video relative">
                                <img src={c.cover} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-full bg-[var(--v-lime)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play size={16} className="text-black" fill="currentColor" />
                                    </div>
                                    <div className="v-chip text-[9px]">{c.duration}</div>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="font-display font-bold text-base line-clamp-1">{c.title}</div>
                                <div className="text-xs text-neutral-500 mt-0.5">{c.creator} · {c.views} views</div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {c.tags.map((t) => <span key={t} className="v-chip text-[9px]">{t}</span>)}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </Section>

            {/* Channels */}
            <Section title="Followed Channels" testIdSuffix="channels">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {CHANNELS.map((ch) => (
                        <div key={ch.name} className="v-card p-5 text-center" data-testid={`channel-${ch.name.replace(/\s+/g,'-').toLowerCase()}`}>
                            <div className="w-16 h-16 rounded-full mx-auto ring-2 ring-[var(--v-lime)]/40 overflow-hidden">
                                <img src={ch.avatar} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="font-display font-bold text-sm mt-3">{ch.name}</div>
                            <div className="text-[11px] text-neutral-500">{ch.subs} Subscribers</div>
                            <button className="mt-3 text-[11px] font-semibold px-3 py-1 rounded-full border border-[var(--v-lime)] text-[var(--v-lime)] hover:bg-[var(--v-lime)] hover:text-black transition-colors">Subscribed</button>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Recommended */}
            <Section title="Recommended for You" accent testIdSuffix="recommended">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {recommended.map((c) => (
                        <button key={c.id} onClick={() => nav(`/app/bookstream/${c.id}`)}
                            className="v-card v-card-hoverlift overflow-hidden text-left group"
                            data-testid={`rec-${c.id}`}>
                            <div className="aspect-[3/4] relative">
                                <img src={c.cover} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3">
                                    <div className="font-display font-bold text-white text-sm line-clamp-2">{c.title}</div>
                                </div>
                            </div>
                            <div className="p-3">
                                <div className="text-[11px] text-neutral-500">Authored by {c.creator}</div>
                                <div className="text-[11px] text-neutral-600 mt-0.5">{c.views} views</div>
                            </div>
                        </button>
                    ))}
                </div>
            </Section>
        </div>
    );
}

function Section({ title, children, accent, testIdSuffix }) {
    return (
        <div data-testid={`bs-section-${testIdSuffix}`}>
            <div className="flex items-center gap-2 mb-4">
                {accent && <Sparkles size={16} className="text-[var(--v-lime)]" />}
                <h2 className="font-display-tight font-black text-2xl">{title}</h2>
                <div className="ml-auto flex gap-1">
                    <button className="w-8 h-8 rounded-full border border-[var(--v-border)] flex items-center justify-center text-neutral-400 hover:text-[var(--v-lime)] hover:border-[var(--v-lime)]"><ChevronLeft size={14} /></button>
                    <button className="w-8 h-8 rounded-full border border-[var(--v-border)] flex items-center justify-center text-neutral-400 hover:text-[var(--v-lime)] hover:border-[var(--v-lime)]"><ChevronRight size={14} /></button>
                </div>
            </div>
            {children}
        </div>
    );
}
