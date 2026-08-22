import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Phone sign-in via Twilio Verify OTP. Issues the same JWT as email/password.
export default function PhoneAuth() {
    const { applySession } = useAuth();
    const nav = useNavigate();
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const sendCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/auth/phone/send-otp", { phone });
            toast.success("Code sent via SMS");
            setStep(2);
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Could not send code");
        } finally {
            setLoading(false);
        }
    };

    const verify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post("/auth/phone/verify-otp", { phone, code, name });
            applySession(data.token, data.user);
            toast.success("Signed in");
            nav("/app");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    if (step === 1) {
        return (
            <form onSubmit={sendCode} className="space-y-5" data-testid="phone-auth-step1">
                <div className="space-y-2">
                    <Label className="text-xs tracking-[0.2em] uppercase text-neutral-400">Phone number</Label>
                    <Input
                        data-testid="phone-input"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+14155552671"
                        required
                        className="bg-[var(--v-surface-2)] border-[var(--v-border)] h-11"
                    />
                    <p className="text-[11px] text-neutral-500">Include your country code, e.g. +1, +91.</p>
                </div>
                <button type="submit" disabled={loading} data-testid="phone-send-code" className="v-btn v-btn-lime w-full h-11 disabled:opacity-60">
                    {loading ? "Sending…" : "Send code"}
                </button>
            </form>
        );
    }

    return (
        <form onSubmit={verify} className="space-y-5" data-testid="phone-auth-step2">
            <div className="space-y-2">
                <Label className="text-xs tracking-[0.2em] uppercase text-neutral-400">Enter the 6-digit code</Label>
                <Input
                    data-testid="phone-code-input"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    required
                    className="bg-[var(--v-surface-2)] border-[var(--v-border)] h-11 tracking-[0.4em] text-center"
                />
                <p className="text-[11px] text-neutral-500">Sent to {phone}.</p>
            </div>
            <div className="space-y-2">
                <Label className="text-xs tracking-[0.2em] uppercase text-neutral-400">Name (optional)</Label>
                <Input
                    data-testid="phone-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Artist name"
                    className="bg-[var(--v-surface-2)] border-[var(--v-border)] h-11"
                />
            </div>
            <button type="submit" disabled={loading} data-testid="phone-verify" className="v-btn v-btn-lime w-full h-11 disabled:opacity-60">
                {loading ? "Verifying…" : "Verify & continue"}
            </button>
            <button type="button" onClick={() => setStep(1)} className="v-link text-sm w-full text-center" data-testid="phone-change-number">
                Use a different number
            </button>
        </form>
    );
}
