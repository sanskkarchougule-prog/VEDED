import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Image, Mic, Video, Clapperboard, Zap, Monitor, BookOpen, Plus, Sparkles, HardDrive } from "lucide-react";
import VededLogo from "@/components/VededLogo";
import { useAuth } from "@/lib/auth";

const NAV = [
    { to: "/app", label: "Home", icon: Home, end: true, testId: "nav-home" },
    { to: "/app/images", label: "Images", icon: Image, testId: "nav-images" },
    { to: "/app/audio", label: "Audio", icon: Mic, testId: "nav-audio" },
    { to: "/app/video", label: "Video", icon: Video, testId: "nav-video" },
    { to: "/app/movies", label: "Movies", icon: Clapperboard, testId: "nav-movies" },
    { to: "/app/shorts", label: "Shorts", icon: Zap, testId: "nav-shorts" },
    { to: "/app/web-series", label: "Web Series", icon: Monitor, testId: "nav-webseries" },
    { to: "/app/bookstream", label: "Book Stream", icon: BookOpen, testId: "nav-bookstream" },
];

export default function Sidebar() {
    const nav = useNavigate();
    const { user } = useAuth();
    const storagePct = 42;
    return (
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-[var(--v-border)] bg-[var(--v-surface)] px-5 py-6 min-h-screen sticky top-0">
            <VededLogo dataTestId="sidebar-logo" />

            <button
                onClick={() => nav("/app/pricing")}
                data-testid="sidebar-new-project"
                className="v-btn v-btn-lime mt-7 w-full text-[13px]"
            >
                <Plus size={16} strokeWidth={3} />
                NEW PROJECT
            </button>

            <nav className="mt-8 flex flex-col gap-1">
                {NAV.map((n) => (
                    <NavLink
                        key={n.to}
                        to={n.to}
                        end={n.end}
                        data-testid={n.testId}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-display font-semibold text-[13px] transition-colors ${
                                isActive
                                    ? "text-[var(--v-lime)] bg-[rgba(195,244,0,0.08)] border-l-2 border-[var(--v-lime)]"
                                    : "text-neutral-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                            }`
                        }
                    >
                        <n.icon size={17} strokeWidth={2} />
                        <span>{n.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="mt-8">
                <div className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 mb-2">LIBRARY</div>
                <div className="flex flex-col gap-1">
                    <button onClick={() => nav("/app")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-neutral-400 hover:text-white hover:bg-white/5 text-left" data-testid="lib-liked">
                        <Sparkles size={15} /> Liked
                    </button>
                    <button onClick={() => nav("/app")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-neutral-400 hover:text-white hover:bg-white/5 text-left" data-testid="lib-saved">
                        <BookOpen size={15} /> Saved
                    </button>
                </div>
            </div>

            <div className="mt-auto pt-6 border-t border-[var(--v-border)]">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] text-neutral-500 mb-2">
                    <HardDrive size={12} /> STORAGE
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
                    <span>{storagePct}%</span>
                    <span className="tabular-nums">{user?.wallet?.image_credits ?? 0} img · {user?.wallet?.video_credits ?? 0} vid</span>
                </div>
                <div className="h-1.5 bg-[var(--v-surface-4)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${storagePct}%`, background: "linear-gradient(90deg,#c3f400,#abd600)" }} />
                </div>
            </div>
        </aside>
    );
}
