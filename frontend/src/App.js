import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "sonner";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import AuthCallback from "@/pages/AuthCallback";
import Settings from "@/pages/Settings";
import Search from "@/pages/Search";
import AppShell from "@/components/AppShell";
import Dashboard from "@/pages/Dashboard";
import ImagesStudio from "@/pages/ImagesStudio";
import VideoStudio from "@/pages/VideoStudio";
import AudioLab from "@/pages/AudioLab";
import MoviesStudio from "@/pages/MoviesStudio";
import WebSeriesStudio from "@/pages/WebSeriesStudio";
import ShortsStudio from "@/pages/ShortsStudio";
import BookStream from "@/pages/BookStream";
import BookStreamDetail from "@/pages/BookStreamDetail";
import Pricing from "@/pages/Pricing";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";

function Protected({ children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function AppRouter() {
    const location = useLocation();
    // Process the Emergent Google auth callback FIRST (reactive hash read), before Protected runs.
    if (location.hash && location.hash.includes("session_id=")) {
        return <AuthCallback />;
    }
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* App shell routes */}
            <Route element={<Protected><AppShell /></Protected>}>
                <Route path="/app" element={<Dashboard />} />
                <Route path="/app/images" element={<ImagesStudio />} />
                <Route path="/app/audio" element={<AudioLab />} />
                <Route path="/app/video" element={<VideoStudio />} />
                <Route path="/app/movies" element={<MoviesStudio />} />
                <Route path="/app/web-series" element={<WebSeriesStudio />} />
                <Route path="/app/shorts" element={<ShortsStudio />} />
                <Route path="/app/bookstream" element={<BookStream />} />
                <Route path="/app/bookstream/:id" element={<BookStreamDetail />} />
                <Route path="/app/pricing" element={<Pricing />} />
                <Route path="/app/settings" element={<Settings />} />
                <Route path="/app/search" element={<Search />} />
            </Route>

            <Route path="/payment/success" element={<Protected><PaymentSuccess /></Protected>} />
            <Route path="/payment/cancel" element={<Protected><PaymentCancel /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster theme="dark" position="top-right" richColors />
                <AppRouter />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
