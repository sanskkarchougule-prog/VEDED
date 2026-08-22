import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function PaymentSuccess() {
    const [params] = useSearchParams();
    const sessionId = params.get("session_id");
    const nav = useNavigate();
    const { refresh } = useAuth();
    const [status, setStatus] = useState("checking");
    const [pkg, setPkg] = useState(null);

    useEffect(() => {
        if (!sessionId) { setStatus("failed"); return; }
        let attempts = 0;
        const tick = async () => {
            attempts += 1;
            try {
                const { data } = await api.get(`/payments/status/${sessionId}`);
                setPkg(data.package_id);
                if (data.payment_status === "paid") {
                    setStatus("paid");
                    refresh();
                    return;
                }
                if (data.payment_status === "expired" || data.payment_status === "failed") {
                    setStatus("failed");
                    return;
                }
                if (attempts >= 10) { setStatus("timeout"); return; }
                setTimeout(tick, 2000);
            } catch {
                if (attempts >= 10) setStatus("failed");
                else setTimeout(tick, 2000);
            }
        };
        tick();
    }, [sessionId, refresh]);

    return (
        <div className="min-h-screen bg-[var(--v-bg)] flex items-center justify-center px-6">
            <div className="max-w-md w-full v-card p-10 text-center" data-testid="payment-success-card">
                {status === "checking" && (
                    <>
                        <div className="mx-auto w-14 h-14 rounded-full border-2 border-[var(--v-lime)] border-t-transparent animate-spin" />
                        <h1 className="font-display-tight font-black text-2xl mt-6">Confirming payment…</h1>
                        <p className="text-neutral-400 text-sm mt-2">This usually takes just a few seconds.</p>
                    </>
                )}
                {status === "paid" && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-[var(--v-lime)] flex items-center justify-center v-glow-lime-strong">
                            <Check size={30} className="text-black" strokeWidth={3} />
                        </div>
                        <h1 className="font-display-tight font-black text-3xl mt-6">Payment received</h1>
                        <p className="text-neutral-400 mt-2 text-sm">Your credits have been topped up. Let's ship something beautiful.</p>
                        <button onClick={() => nav("/app")} className="v-btn v-btn-lime mt-6 w-full" data-testid="success-go-studio">
                            Open Studio <ArrowRight size={15} />
                        </button>
                    </>
                )}
                {(status === "failed" || status === "timeout") && (
                    <>
                        <h1 className="font-display-tight font-black text-2xl text-red-400">Payment not confirmed</h1>
                        <p className="text-neutral-400 mt-2 text-sm">If you were charged, credits will appear once Stripe finalises.</p>
                        <button onClick={() => nav("/app/pricing")} className="v-btn v-btn-ghost mt-6 w-full" data-testid="success-back">Back to Pricing</button>
                    </>
                )}
            </div>
        </div>
    );
}
