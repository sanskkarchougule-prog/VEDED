import React from "react";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Studio from "./pages/Studio";
import Gallery from "./pages/Gallery";
import Discover from "./pages/Discover";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import Reels from "./pages/Reels";
import Admin from "./pages/Admin";

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] grain">
      <Navbar />
      {children}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster theme="dark" position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Shell><Landing /></Shell>} />
          <Route path="/login" element={<Shell><Auth mode="login" /></Shell>} />
          <Route path="/register" element={<Shell><Auth mode="register" /></Shell>} />
          <Route path="/pricing" element={<Shell><Pricing /></Shell>} />
          <Route path="/discover" element={<Shell><Discover /></Shell>} />
          <Route path="/studio" element={<ProtectedRoute><Shell><Studio /></Shell></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Shell><Gallery /></Shell></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute><Shell><Billing /></Shell></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute admin><Shell><Admin /></Shell></ProtectedRoute>} />
          <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
