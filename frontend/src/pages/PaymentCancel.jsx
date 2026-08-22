import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function PaymentCancel() {
    const nav = useNavigate();
    return (
        <div className="min-h-screen bg-[var(--v-bg)] flex items-center justify-center px-6">
            <div className="max-w-md w-full v-card p-10 text-center" data-testid="payment-cancel-card">
                <XCircle size={40} className="mx-auto text-neutral-400" />
                <h1 className="font-display-tight font-black text-3xl mt-4">Checkout cancelled</h1>
                <p className="text-neutral-400 mt-2 text-sm">No charges were made. Come back any time to upgrade.</p>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => nav("/app/pricing")} className="v-btn v-btn-ghost flex-1" data-testid="cancel-pricing">Back to Pricing</button>
                    <button onClick={() => nav("/app")} className="v-btn v-btn-lime flex-1" data-testid="cancel-studio">Studio</button>
                </div>
            </div>
        </div>
    );
}
