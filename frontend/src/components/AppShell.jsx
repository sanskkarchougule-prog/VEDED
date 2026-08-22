import React from "react";
import { Outlet } from "react-router-dom";
import TopBar from "@/components/TopBar";

export default function AppShell() {
    return (
        <div className="min-h-screen bg-[var(--v-bg)] flex flex-col">
            <TopBar />
            <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 lg:px-10 py-8" data-testid="app-main">
                <Outlet />
            </main>
            <footer className="border-t border-[var(--v-border)] mt-16">
                <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 flex items-center justify-between text-xs text-neutral-500">
                    <span>© 2026 VEDED Creative Suite</span>
                    <span className="tabular-nums">Powered by Higgsfield · Sarvam AI · Emergent</span>
                </div>
            </footer>
        </div>
    );
}
