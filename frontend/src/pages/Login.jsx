import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import VededLogo from "@/components/VededLogo";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [loading, setLoading] = useState(false);

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
                <form onSubmit={submit} className="w-full max-w-md" data-testid="login-form">
                    <div className="lg:hidden mb-8"><VededLogo to="/" /></div>
                    <h1 className="font-display-tight font-black text-4xl">Welcome back</h1>
                    <p className="text-neutral-400 mt-2 text-sm">Sign in to your VEDED studio.</p>
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
                        <p className="text-sm text-neutral-400 text-center">
                            New to VEDED? <Link to="/signup" className="v-link font-semibold" data-testid="login-signup-link">Create an account</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
