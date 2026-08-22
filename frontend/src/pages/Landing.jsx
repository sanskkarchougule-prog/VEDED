import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Video, Mic, Image as ImageIcon, BookOpen, Zap, Clapperboard, Monitor } from "lucide-react";
import VededLogo from "@/components/VededLogo";
import { useAuth } from "@/lib/auth";

const HERO_IMAGE = "https://images.unsplash.com/photo-1614850523011-8f49ffc73908?w=1600";
const SHOWCASE = [
    "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
];

const STUDIOS = [
    { icon: ImageIcon, title: "Images Studio", desc: "Neural prompt to 4K photorealistic images. FLUX + SDXL." },
    { icon: Video, title: "Video Studio", desc: "5-second cinematic clips with motion intensity control." },
    { icon: Mic, title: "Audio Lab", desc: "Sarvam Bulbul v3 voices in 10+ Indian languages." },
    { icon: Clapperboard, title: "Feature Film", desc: "Long-format movie compiler with FFmpeg stitching." },
    { icon: Zap, title: "Shorts Studio", desc: "9:16 viral clips with trending motion presets." },
    { icon: Monitor, title: "Web Series", desc: "Episode planner with cast bibles for consistency." },
    { icon: BookOpen, title: "Book Stream", desc: "Turn books into AI audiobooks and cinematic series." },
];

export default function Landing() {
    const nav = useNavigate();
    const { user } = useAuth();
    return (
        <div className="min-h-screen bg-[var(--v-bg)]">
            {/* Top nav */}
            <nav className="v-glass sticky top-0 z-30 border-b border-[var(--v-border)] px-6 md:px-12 py-4 flex items-center justify-between">
                <VededLogo />
                <div className="hidden md:flex items-center gap-8 text-[13px] font-display font-semibold">
                    <a href="#studios" className="text-neutral-300 hover:text-[var(--v-lime)]" data-testid="landing-link-studios">Studios</a>
                    <a href="#bookstream" className="text-neutral-300 hover:text-[var(--v-lime)]" data-testid="landing-link-bookstream">Book Stream</a>
                    <a href="#pricing" className="text-neutral-300 hover:text-[var(--v-lime)]" data-testid="landing-link-pricing">Pricing</a>
                </div>
                <div className="flex items-center gap-3">
                    {user ? (
                        <button onClick={() => nav("/app")} className="v-btn v-btn-lime text-[13px]" data-testid="landing-open-app">
                            Open Studio <ArrowRight size={14} />
                        </button>
                    ) : (
                        <>
                            <button onClick={() => nav("/login")} className="v-btn v-btn-ghost text-[13px]" data-testid="landing-signin">Sign in</button>
                            <button onClick={() => nav("/signup")} className="v-btn v-btn-lime text-[13px]" data-testid="landing-signup">Get Started</button>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 opacity-25">
                    <img src={HERO_IMAGE} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--v-bg)] via-[var(--v-bg)]/50 to-[var(--v-bg)]" />
                </div>
                <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-20 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
                    <div>
                        <div className="v-chip v-chip-lime mb-6" data-testid="landing-eyebrow">
                            <Sparkles size={11} className="mr-1.5" /> AI-NATIVE PRODUCTION SUITE
                        </div>
                        <h1 className="font-display-tight font-black text-5xl md:text-7xl lg:text-[88px] leading-[0.95] text-white">
                            Cinematic ideas.<br/>
                            <span className="text-[var(--v-lime)]">One studio.</span>
                        </h1>
                        <p className="mt-6 text-lg text-neutral-300 max-w-xl leading-relaxed">
                            Generate images, videos, audio, feature films and web series — then stream your book adaptations on Book Stream. All powered by unified AI, no watermarks, dubbed in 10+ Indian languages.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <button onClick={() => nav(user ? "/app" : "/signup")} className="v-btn v-btn-lime text-[14px] px-6 py-3.5" data-testid="landing-cta-primary">
                                Start Creating Free <ArrowRight size={16} />
                            </button>
                            <button onClick={() => nav("/signup")} className="v-btn v-btn-ghost text-[14px] px-6 py-3.5" data-testid="landing-cta-secondary">
                                Watch on Book Stream
                            </button>
                        </div>
                        <div className="mt-10 flex items-center gap-6 text-xs text-neutral-500">
                            <div className="flex -space-x-2">
                                {["a","b","c","d"].map((k) => (
                                    <div key={`avatar-${k}`} className="w-7 h-7 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 border-2 border-[var(--v-bg)]" />
                                ))}
                            </div>
                            <span>Trusted by 12,400+ creators</span>
                        </div>
                    </div>

                    {/* Bento showcase */}
                    <div className="grid grid-cols-6 grid-rows-6 gap-3 h-[520px]">
                        <div className="col-span-4 row-span-4 rounded-2xl overflow-hidden v-glow-lime border border-[var(--v-border-2)]">
                            <img src={SHOWCASE[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden border border-[var(--v-border)]">
                            <img src={SHOWCASE[1]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="col-span-2 row-span-2 rounded-2xl bg-[var(--v-surface-2)] border border-[var(--v-border)] p-4 flex flex-col justify-between">
                            <div className="v-chip v-chip-lime self-start">LIVE</div>
                            <div>
                                <div className="text-[9px] font-bold tracking-[0.3em] text-neutral-500">GPU LOAD</div>
                                <div className="font-display-tight font-black text-3xl text-[var(--v-lime)]">42%</div>
                                <div className="text-[10px] text-neutral-500 mt-0.5">RTX 5090 Cloud</div>
                            </div>
                        </div>
                        <div className="col-span-3 row-span-2 rounded-2xl overflow-hidden border border-[var(--v-border)] relative">
                            <img src={SHOWCASE[2]} alt="" className="w-full h-full object-cover" />
                            <div className="absolute bottom-2 left-2 right-2 v-chip v-chip-lime text-[10px]">RENDERING · 68%</div>
                        </div>
                        <div className="col-span-3 row-span-2 rounded-2xl overflow-hidden border border-[var(--v-border)]">
                            <img src={SHOWCASE[3]} alt="" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Studios grid */}
            <section id="studios" className="max-w-7xl mx-auto px-6 md:px-12 py-24">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <div className="v-chip mb-3">SEVEN STUDIOS · ONE WORKFLOW</div>
                        <h2 className="font-display-tight font-black text-4xl md:text-5xl">Every creative discipline, unified.</h2>
                    </div>
                    <a href="#pricing" className="hidden md:block v-link text-sm font-semibold">See pricing →</a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {STUDIOS.map((s) => (
                        <div key={s.title} className="v-card v-card-hoverlift p-6" data-testid={`studio-${s.title.toLowerCase().replace(/\s+/g,'-')}`}>
                            <div className="w-12 h-12 rounded-xl bg-[var(--v-surface-3)] border border-[var(--v-border)] flex items-center justify-center mb-4">
                                <s.icon size={20} className="text-[var(--v-lime)]" />
                            </div>
                            <h3 className="font-display font-bold text-lg mb-1">{s.title}</h3>
                            <p className="text-sm text-neutral-400 leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* BookStream teaser */}
            <section id="bookstream" className="relative py-24">
                <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="v-chip v-chip-lime mb-4">BOOK STREAM · OTT</div>
                        <h2 className="font-display-tight font-black text-4xl md:text-5xl leading-tight">Books, reborn as cinema.</h2>
                        <p className="mt-4 text-neutral-300 leading-relaxed max-w-lg">
                            Stream AI-generated audiobooks, animated series and full features made from your favourite books — dubbed on demand in 10+ Indian languages.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => nav(user ? "/app/bookstream" : "/signup")} className="v-btn v-btn-lime text-[13px]" data-testid="landing-bookstream-cta">
                                Try 1 free episode
                            </button>
                            <button onClick={() => nav("/signup")} className="v-btn v-btn-ghost text-[13px]" data-testid="landing-bookstream-plans">See plans</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {SHOWCASE.slice(0,3).map((s, i) => (
                            <div key={s} className={`rounded-xl overflow-hidden border border-[var(--v-border)] ${i === 1 ? "translate-y-8" : ""}`}>
                                <img src={s} alt="" className="w-full h-72 object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="pricing" className="max-w-7xl mx-auto px-6 md:px-12 py-16 text-center">
                <h2 className="font-display-tight font-black text-4xl">Ready to ship your masterpiece?</h2>
                <p className="text-neutral-400 mt-3 max-w-xl mx-auto">Free forever plan. Upgrade any time.</p>
                <button onClick={() => nav("/signup")} className="v-btn v-btn-lime mt-6 text-[14px] px-6 py-3.5" data-testid="landing-final-cta">
                    Create your account <ArrowRight size={16} />
                </button>
            </section>

            <footer className="border-t border-[var(--v-border)] py-8 text-center text-sm text-neutral-500">
                © 2026 VEDED Studio · Powered by Higgsfield · Sarvam AI · Emergent
            </footer>
        </div>
    );
}
