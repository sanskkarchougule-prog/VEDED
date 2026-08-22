import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, Settings, LogOut, Coins, Plus, Home, Image, Mic, Video, Clapperboard, Zap, Monitor, BookOpen } from "lucide-react";
import VededLogo from "@/components/VededLogo";
import { useAuth } from "@/lib/auth";
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

export default function TopBar() {
    const nav = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const initial = (user?.name || user?.email || "?")[0]?.toUpperCase();
    const isActive = (item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);

    return (
        <header className="v-glass sticky top-0 z-30 border-b border-[var(--v-border)]">
            {/* Row 1 — Logo · Search · Credits · Avatar */}
            <div className="flex items-center gap-4 px-6 lg:px-10 py-3.5">
                <VededLogo dataTestId="topbar-logo" size="sm" subtitle={false} />
                <div className="hidden md:block h-6 w-px bg-[var(--v-border-2)]" />

                <button
                    onClick={() => nav("/app/pricing")}
                    data-testid="topbar-new-project"
                    className="hidden lg:inline-flex v-btn v-btn-lime text-[12px] py-2 px-3.5"
                >
                    <Plus size={14} strokeWidth={3} />
                    NEW PROJECT
                </button>

                <div className="flex-1 max-w-xl relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                        data-testid="topbar-search"
                        placeholder="Search assets, prompts, projects…"
                        className="w-full bg-[var(--v-surface-2)] border border-[var(--v-border)] rounded-full pl-11 pr-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-[var(--v-lime)] focus:outline-none transition-colors"
                    />
                </div>

                <button
                    onClick={() => nav("/app/pricing")}
                    data-testid="topbar-credits"
                    className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full border border-[var(--v-border)] bg-[var(--v-surface-2)] hover:border-[var(--v-lime)] transition-colors"
                >
                    <Coins size={14} className="text-[var(--v-lime)]" />
                    <span className="text-[12px] font-semibold text-neutral-200 tabular-nums">
                        {(user?.wallet?.image_credits ?? 0) + (user?.wallet?.video_credits ?? 0)}
                    </span>
                    <span className="v-chip v-chip-lime text-[9px] px-2 py-0.5">{user?.veded_tier?.replace("veded_", "") || "free"}</span>
                </button>

                <button className="p-2 rounded-full hover:bg-white/5 text-neutral-400 hover:text-white" data-testid="topbar-notifications">
                    <Bell size={17} />
                </button>
                <button className="p-2 rounded-full hover:bg-white/5 text-neutral-400 hover:text-white" data-testid="topbar-settings">
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
                            <div className="text-xs text-neutral-500">{user?.email}</div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-[var(--v-border)]" />
                        <DropdownMenuItem onClick={() => nav("/app/pricing")} data-testid="menu-upgrade">
                            Upgrade Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => nav("/app")} data-testid="menu-dashboard">
                            Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[var(--v-border)]" />
                        <DropdownMenuItem onClick={() => { logout(); nav("/"); }} className="text-red-400" data-testid="menu-logout">
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
