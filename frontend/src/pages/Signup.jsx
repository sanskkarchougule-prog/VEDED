import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import VededLogo from "@/components/VededLogo";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleButton from "@/components/GoogleButton";
import PhoneAuth from "@/components/PhoneAuth";

export default function Signup() {
    const { signup } = useAuth();
    const nav = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState("email");
    const [phoneEnabled, setPhoneEnabled] = useState(false);

    useEffect(() => {
        api.get("/auth/phone/enabled").then(({ data }) => setPhoneEnabled(!!data.enabled)).catch(() => {});
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signup(email, pw, name);
            toast.success("Studio activated");
            nav("/app");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] bg-[var(--v-bg)]">
            <div className="flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md" data-testid="signup-container">
                    <Link to="/"><VededLogo to={null} /></Link>
                    <h1 className="font-display-tight font-black text-4xl mt-8">Activate your studio</h1>
                    <p className="text-neutral-400 mt-2 text-sm">10 free images, 1 free video and audio to start.</p>
                    {phoneEnabled && (
                        <div className="mt-6 grid grid-cols-2 gap-1 p-1 rounded-lg bg-[var(--v-surface-2)] border border-[var(--v-border)]">
                            <button type="button" onClick={() => setMethod("email")} data-testid="method-email" className={`h-9 rounded-md text-sm font-semibold transition-colors ${method === "email" ? "bg-[var(--v-lime)] text-black" : "text-neutral-400"}`}>Email</button>
                            <button type="button" onClick={() => setMethod("phone")} data-testid="method-phone" className={`h-9 rounded-md text-sm font-semibold transition-colors ${method === "phone" ? "bg-[var(--v-lime)] text-black" : "text-neutral-400"}`}>Phone</button>
                        </div>
                    )}
                    {method === "phone" ? (
                        <div className="mt-8"><PhoneAuth /></div>
                    ) : (
                    <form onSubmit={submit} data-testid="signup-form">
                    <div className="mt-8 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-xs tracking-[0.2em] uppercase text-neutral-400">Name</Label>
                            <Input data-testid="signup-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Artist name" className="bg-[var(--v-surface-2)] border-[var(--v-border)] h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs tracking-[0.2em] uppercase text-neutral-400">Email</Label>
                            <Input data-testid="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-[var(--v-surface-2)] border-[var(--v-border)] h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs tracking-[0.2em] uppercase text-neutral-400">Password</Label>
                            <Input data-testid="signup-password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} className="bg-[var(--v-surface-2)] border-[var(--v-border)] h-11" />
                            <p className="text-[11px] text-neutral-500">Minimum 6 characters.</p>
                        </div>
                        <button type="submit" disabled={loading} data-testid="signup-submit" className="v-btn v-btn-lime w-full h-11 disabled:opacity-60">
                            {loading ? "Creating…" : "Create studio"}
                        </button>
                        <div className="flex items-center gap-3 py-1">
                            <span className="h-px flex-1 bg-[var(--v-border)]" />
                            <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">or</span>
                            <span className="h-px flex-1 bg-[var(--v-border)]" />
                        </div>
                        <GoogleButton label="Sign up with Google" />
                    </div>
                    </form>
                    )}
                    <p className="text-sm text-neutral-400 text-center mt-6">
                        Already have an account? <Link to="/login" className="v-link font-semibold" data-testid="signup-login-link">Sign in</Link>
                    </p>
                </div>
            </div>
            <div className="hidden lg:block relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600" alt="" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-tl from-[var(--v-bg)] via-transparent to-transparent" />
            </div>
        </div>
    );
}
