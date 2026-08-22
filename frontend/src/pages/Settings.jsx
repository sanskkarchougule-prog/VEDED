import React, { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { User, Coins, Shield, LogOut, Save, Crown } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Settings() {
    const { user, refresh, logout } = useAuth();
    const nav = useNavigate();
    const [name, setName] = useState(user?.name || "");
    const [saving, setSaving] = useState(false);
    const w = user?.wallet || {};

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch("/auth/profile", { name });
            await refresh();
            toast.success("Profile updated");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Could not update profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 max-w-3xl" data-testid="settings-page">
            <div>
                <h1 className="font-display-tight font-black text-4xl text-[var(--v-lime)]">Settings</h1>
                <p className="text-neutral-400 mt-2 text-[15px]">Manage your profile, plan and credits.</p>
            </div>

            {/* Profile */}
            <section className="v-card p-6">
                <div className="flex items-center gap-2 mb-5"><User size={16} className="text-[var(--v-lime)]" /><h2 className="font-display font-bold text-lg">Profile</h2></div>
                <form onSubmit={save} className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-xs tracking-[0.2em] uppercase text-neutral-400">Name</Label>
                        <Input data-testid="settings-name" value={name} onChange={(e) => setName(e.target.value)} className="bg-[var(--v-surface-2)] border-[var(--v-border)] h-11 max-w-md" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs tracking-[0.2em] uppercase text-neutral-400">{user?.email ? "Email" : "Phone"}</Label>
                        <Input disabled value={user?.email || user?.phone || ""} className="bg-[var(--v-surface-2)] border-[var(--v-border)] h-11 max-w-md opacity-70" data-testid="settings-contact" />
                    </div>
                    <button type="submit" disabled={saving} data-testid="settings-save" className="v-btn v-btn-lime h-11 px-5 disabled:opacity-60">
                        <Save size={15} /> {saving ? "Saving…" : "Save changes"}
                    </button>
                </form>
            </section>

            {/* Plan & credits */}
            <section className="v-card p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2"><Coins size={16} className="text-[var(--v-lime)]" /><h2 className="font-display font-bold text-lg">Plan & Credits</h2></div>
                    <span className="v-chip v-chip-lime text-[10px] flex items-center gap-1"><Crown size={11} /> {user?.veded_tier?.replace("veded_", "") || "free"}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Stat label="Images" value={w.image_credits ?? 0} testid="stat-image" />
                    <Stat label="Video / Movie" value={w.video_credits ?? 0} testid="stat-video" />
                    <Stat label="Audio chars" value={w.audio_chars ?? 0} testid="stat-audio" />
                    <Stat label="Dubbing" value={w.dubbing_credits ?? 0} testid="stat-dubbing" />
                </div>
                <button onClick={() => nav("/app/pricing")} data-testid="settings-upgrade" className="v-btn v-btn-lime h-11 px-5 mt-6">
                    Top up / Upgrade plan
                </button>
            </section>

            {/* Account */}
            <section className="v-card p-6">
                <div className="flex items-center gap-2 mb-5"><Shield size={16} className="text-[var(--v-lime)]" /><h2 className="font-display font-bold text-lg">Account</h2></div>
                <button onClick={() => { logout(); nav("/"); }} data-testid="settings-logout" className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors font-semibold text-sm">
                    <LogOut size={15} /> Sign out
                </button>
            </section>
        </div>
    );
}

function Stat({ label, value, testid }) {
    return (
        <div className="rounded-xl border border-[var(--v-border)] bg-[var(--v-surface-2)] p-4" data-testid={testid}>
            <div className="text-2xl font-display font-black text-[var(--v-lime)] tabular-nums">{Number(value).toLocaleString()}</div>
            <div className="text-[11px] text-neutral-400 mt-1">{label}</div>
        </div>
    );
}
