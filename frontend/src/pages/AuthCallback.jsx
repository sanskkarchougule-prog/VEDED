import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import VededLogo from "@/components/VededLogo";

// Handles the return from Emergent Google auth ({origin}/app#session_id=...).
// Exchanges the one-time session_id (server-side) for a JWT, then lands in the studio.
export default function AuthCallback() {
    const { googleLogin } = useAuth();
    const nav = useNavigate();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;
        const match = window.location.hash.match(/session_id=([^&]+)/);
        const sessionId = match ? decodeURIComponent(match[1]) : null;
        if (!sessionId) {
            nav("/login", { replace: true });
            return;
        }
        googleLogin(sessionId)
            .then(() => {
                toast.success("Signed in with Google");
                nav("/app", { replace: true });
            })
            .catch((err) => {
                toast.error(err?.response?.data?.detail || "Google sign-in failed");
                nav("/login", { replace: true });
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[var(--v-bg)]">
            <VededLogo to={null} />
            <div className="flex items-center gap-3 text-neutral-300">
                <span className="w-5 h-5 border-2 border-[var(--v-lime)] border-t-transparent rounded-full animate-spin" />
                Signing you in…
            </div>
        </div>
    );
}
