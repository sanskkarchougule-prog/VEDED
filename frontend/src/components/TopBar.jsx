import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, Settings, LogOut, Coins, Plus, Home, Image, Mic, Video, Clapperboard, Zap, Monitor, BookOpen, Sparkles, AlertTriangle, Star, Check } from "lucide-react";
import VededLogo from "@/components/VededLogo";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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

// Studios you can launch a "new project" into (exclude Home).
const NEW_PROJECT_OPTIONS = NAV.filter((n) => n.to !== "/app");

const NOTIF_ICONS = { sparkles: Sparkles, alert: AlertTriangle, star: Star };

export default function TopBar() {
    const nav = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const initial = (user?.name || user?.email || "?")[0]?.toUpperCase();
    const isActive = (item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);

    const [q, setQ] = useState("");
    const [notifs, setNotifs] = useState([]);
    const [unread, setUnread] = useState(0);

    const w = user?.wallet || {};
    const totalCredits = (w.image_credits ?? 0) + (w.video_credits ?? 0);

    const loadNotifs = useCallback(async () => {
        try {
            const { data } = await api.get("/auth/notifications");
            setNotifs(data.notifications || []);
            setUnread(data.unread || 0);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { loadNotifs(); }, [loadNotifs, location.pathname]);

    const submitSearch = (e) => {
        e.preventDefault();
        if (!q.trim()) return;
        nav(`/app/search?q=${encodeURIComponent(q.trim())}`);
    };

    return (
        <header className="v-glass sticky top-0 z-30 border-b border-[var(--v-border)]">
            {/* Row 1 — Logo · New · Search · Credits · Notif · Settings · Avatar */}
            <div className="flex items-center gap-4 px-6 lg:px-10 py-3.5">
                <VededLogo dataTestId="topbar-logo" size="sm" subtitle={false} />
                <div className="hidden md:block h-6 w-px bg-[var(--v-border-2)]" />

                {/* NEW PROJECT dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            data-testid="topbar-new-project"
                            className="hidden lg:inline-flex v-btn v-btn-lime text-[12px] py-2 px-3.5"
                        >
                            <Plus size={14} strokeWidth={3} />
                            NEW PROJECT
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-[var(--v-surface-2)] border-[var(--v-border-2)] w-60" data-testid="new-project-menu">
                        <DropdownMenuLabel className="text-neutral-400 text-[10px] tracking-[0.2em] uppercase">Start creating</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-[var(--v-border)]" />
                        {NEW_PROJECT_OPTIONS.map((o) => (
                            <DropdownMenuItem
                                key={o.to}
                                onClick={() => nav(o.to)}
                                data-testid={`new-project-${o.testId}`}
                                className="gap-2.5 cursor-pointer"
                            >
                                <o.icon size={15} className="text-[var(--v-lime)]" />
                                <span className="text-[13px] text-neutral-100">{o.label}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* SEARCH */}
                <form onSubmit={submitSearch} className="flex-1 max-w-xl relative" data-testid="topbar-search-form">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                        data-testid="topbar-search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search your creations by prompt…"
                        className="w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-full pl-11 pr-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-[var(--v-lime)] focus:outline-none transition-colors"
                    />
                </form>

                {/* CREDITS dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            data-testid="topbar-credits"
                            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full border border-[var(--v-border)] bg-[var(--v-surface-2)] hover:border-[var(--v-lime)] transition-colors"
                        >
                            <Coins size={14} className="text-[var(--v-lime)]" />
                            <span className="text-[12px] font-semibold text-neutral-200 tabular-nums">{totalCredits}</span>
                            <span className="v-chip v-chip-lime text-[9px] px-2 py-0.5">{user?.veded_tier?.replace("veded_", "") || "free"}</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[var(--v-surface-2)] border-[var(--v-border-2)] w-64" data-testid="credits-menu">
                        <DropdownMenuLabel className="text-neutral-200 flex items-center gap-2"><Coins size={14} className="text-[var(--v-lime)]" /> Your credits</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-[var(--v-border)]" />
                        <CreditRow label="Images" value={w.image_credits ?? 0} testid="credit-image" />
                        <CreditRow label="Video / Movie" value={w.video_credits ?? 0} testid="credit-video" />
                        <CreditRow label="Audio (chars)" value={w.audio_chars ?? 0} testid="credit-audio" />
                        <CreditRow label="Dubbing" value={w.dubbing_credits ?? 0} testid="credit-dubbing" />
                        <DropdownMenuSeparator className="bg-[var(--v-border)]" />
                        <DropdownMenuItem onClick={() => nav("/app/pricing")} data-testid="credits-topup" className="text-[var(--v-lime)] font-semibold cursor-pointer">
                            <Plus size={14} className="mr-2" /> Top up / Upgrade
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* NOTIFICATIONS dropdown */}
                <DropdownMenu onOpenChange={(o) => { if (o) { loadNotifs(); setUnread(0); } }}>
                    <DropdownMenuTrigger asChild>
                        <button className="relative p-2 rounded-full hover:bg-white/5 text-neutral-400 hover:text-white" data-testid="topbar-notifications">
                            <Bell size={17} />
                            {unread > 0 && (
                                <span data-testid="notif-badge" className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--v-lime)] text-black text-[9px] font-black flex items-center justify-center">{unread}</span>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[var(--v-surface-2)] border-[var(--v-border-2)] w-80" data-testid="notifications-menu">
                        <DropdownMenuLabel className="text-neutral-200">Notifications</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-[var(--v-border)]" />
                        {notifs.length === 0 ? (
                            <div className="px-3 py-6 text-center text-sm text-neutral-500" data-testid="notif-empty">You're all caught up.</div>
                        ) : (
                            notifs.map((n) => {
                                const NI = NOTIF_ICONS[n.icon] || Sparkles;
                                return (
                                    <div key={n.id} className="flex gap-3 px-3 py-2.5 hover:bg-white/5" data-testid={`notif-${n.id}`}>
                                        <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${n.kind === "alert" ? "bg-amber-400/15 text-amber-400" : "bg-[rgba(195,244,0,0.12)] text-[var(--v-lime)]"}`}>
                                            <NI size={14} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[13px] font-semibold text-neutral-100">{n.title}</div>
                                            <div className="text-[12px] text-neutral-400 line-clamp-2">{n.body}</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* SETTINGS */}
                <button
                    onClick={() => nav("/app/settings")}
                    className="p-2 rounded-full hover:bg-white/5 text-neutral-400 hover:text-white"
                    data-testid="topbar-settings"
                >
                    <Settings size={17} />
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button data-testid="topbar-avatar" className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--v-lime)] to-[var(--v-lime-dim)] text-black font-display font-black flex items-center justify-center border-2 border-[var(--v-lime)] hover:v-glow-lime-strong transition-shadow">
                            {initial}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[var(--v-surface-2)] border-[var(--v-border-2)] w-52">
                        <DropdownMenuLabel className="text-neutral-400">
                            <div className="text-neutral-200 font-semibold">{user?.name}</div>
                            <div className="text-xs text-neutral-500">{user?.email || user?.phone}</div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-[var(--v-border)]" />
                        <DropdownMenuItem onClick={() => nav("/app/settings")} data-testid="menu-settings" className="cursor-pointer">
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => nav("/app/pricing")} data-testid="menu-upgrade" className="cursor-pointer">
                            Upgrade Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => nav("/app")} data-testid="menu-dashboard" className="cursor-pointer">
                            Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[var(--v-border)]" />
                        <DropdownMenuItem onClick={() => { logout(); nav("/"); }} className="text-red-400 cursor-pointer" data-testid="menu-logout">
                            <LogOut size={14} className="mr-2" /> Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Row 2 — Horizontal studio nav */}
            <nav className="px-6 lg:px-10 flex items-center gap-1 overflow-x-auto border-t border-[var(--v-border)]/70">
                {NAV.map((n) => {
                    const active = isActive(n);
                    return (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            end={n.end}
                            data-testid={n.testId}
                            className={`relative flex items-center gap-2 px-4 py-3.5 font-display font-bold text-[13px] whitespace-nowrap transition-colors ${
                                active ? "text-[var(--v-lime)]" : "text-neutral-400 hover:text-white"
                            }`}
                        >
                            <n.icon size={15} strokeWidth={2.2} />
                            <span>{n.label}</span>
                            {active && (
                                <span className="pointer-events-none absolute left-3 right-3 -bottom-px h-[2px] rounded-full bg-[var(--v-lime)] v-glow-lime-strong" />
                            )}
                        </NavLink>
                    );
                })}
            </nav>
        </header>
    );
}

function CreditRow({ label, value, testid }) {
    return (
        <div className="flex items-center justify-between px-3 py-1.5 text-[13px]" data-testid={testid}>
            <span className="text-neutral-400">{label}</span>
            <span className="font-semibold text-neutral-100 tabular-nums">{Number(value).toLocaleString()}</span>
        </div>
    );
}
