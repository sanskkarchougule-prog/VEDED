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

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
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
            await login(email, pw);
            toast.success("Welcome back");
            nav("/app");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] bg-[var(--v-bg)]">
            <div className="hidden lg:block relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1614850523011-8f49ffc73908?w=1600" alt="" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--v-bg)] via-transparent to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-between p-12">
                    <Link to="/"><VededLogo to={null} /></Link>
                    <div>
                        <h2 className="font-display-tight font-black text-4xl leading-tight max-w-md">
                            Cinematic ideas, <span className="text-[var(--v-lime)]">rendered.</span>
                        </h2>
                        <p className="text-neutral-300 mt-3 max-w-md">Continue where your creative engine left off.</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="lg:hidden mb-8"><VededLogo to="/" /></div>
                    <h1 className="font-display-tight font-black text-4xl">Welcome back</h1>
                    <p className="text-neutral-400 mt-2 text-sm">Sign in to your VEDED studio.</p>
                    {phoneEnabled && (
                        <div className="mt-6 grid grid-cols-2 gap-1 p-1 rounded-lg bg-[var(--v-surface-2)] border border-[var(--v-border)]">
                            <button type="button" onClick={() => setMethod("email")} data-testid="method-email" className={`h-9 rounded-md text-sm font-semibold transition-colors ${method === "email" ? "bg-[var(--v-lime)] text-black" : "text-neutral-400"}`}>Email</button>
                            <button type="button" onClick={() => setMethod("phone")} data-testid="method-phone" className={`h-9 rounded-md text-sm font-semibold transition-colors ${method === "phone" ? "bg-[var(--v-lime)] text-black" : "text-neutral-400"}`}>Phone</button>
                        </div>
                    )}
                    {method === "phone" ? (
                        <div className="mt-8"><PhoneAuth /></div>
                    ) : (
                    <form onSubmit={submit} data-testid="login-form">
                    <div className="mt-8 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs tracking-[0.2em] uppercase text-neutral-400">Email</Label>
                            <Input id="email" data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-[var(--v-surface-2)] border-[var(--v-border)] h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pw" className="text-xs tracking-[0.2em] uppercase text-neutral-400">Password</Label>
                            <Input id="pw" data-testid="login-password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required className="bg-[var(--v-surface-2)] border-[var(--v-border)] h-11" />
                        </div>
                        <button type="submit" disabled={loading} data-testid="login-submit" className="v-btn v-btn-lime w-full h-11 disabled:opacity-60">
                            {loading ? "Signing in…" : "Sign in"}
                        </button>
                        <div className="flex items-center gap-3 py-1">
                            <span className="h-px flex-1 bg-[var(--v-border)]" />
                            <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">or</span>
                            <span className="h-px flex-1 bg-[var(--v-border)]" />
                        </div>
                        <GoogleButton label="Sign in with Google" />
                    </div>
                    </form>
                    )}
                    <p className="text-sm text-neutral-400 text-center mt-6">
                        New to VEDED? <Link to="/signup" className="v-link font-semibold" data-testid="login-signup-link">Create an account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
