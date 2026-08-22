import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, Coins, LogOut, Shield, Menu, X } from "lucide-react";

const links = [
  { to: "/studio", label: "Studio" },
  { to: "/discover", label: "Discover" },
  { to: "/reels", label: "Reels" },
  { to: "/gallery", label: "Gallery" },
  { to: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  if (loc.pathname === "/reels") return null;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10" data-testid="navbar">
      <div className="max-w-[1400px] mx-auto px-5 h-16 flex items-center justify-between">
        <Link to={user ? "/studio" : "/"} className="flex items-center gap-2" data-testid="nav-logo">
          <div className="w-8 h-8 rounded-md btn-gradient flex items-center justify-center">
            <Sparkles size={17} className="text-white" />
          </div>
          <span className="display text-xl font-semibold tracking-tight">VEDED</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.label.toLowerCase()}`}
              className={`text-sm tracking-wide transition-colors ${
                loc.pathname === l.to ? "text-[#F0F0F0]" : "text-[#A0A0A0] hover:text-[#F0F0F0]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/billing"
                data-testid="nav-credits"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
              >
                <Coins size={15} className="text-[#FF4466]" />
                <span className="font-semibold">{user.credits}</span>
                <span className="text-[#A0A0A0]">credits</span>
              </Link>
              {user.role === "admin" && (
                <Link to="/admin" data-testid="nav-admin" className="p-2 rounded-md hover:bg-white/10 transition-colors" title="Admin">
                  <Shield size={18} className="text-[#0055FF]" />
                </Link>
              )}
              <button
                onClick={() => { logout(); nav("/"); }}
                data-testid="nav-logout"
                className="p-2 rounded-md hover:bg-white/10 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
              <button className="md:hidden p-2" onClick={() => setOpen(!open)} data-testid="nav-mobile-toggle">
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" data-testid="nav-login" className="text-sm text-[#A0A0A0] hover:text-[#F0F0F0] transition-colors">
                Log in
              </Link>
              <Link
                to="/register"
                data-testid="nav-signup"
                className="btn-gradient text-white text-sm font-semibold px-4 py-2 rounded-full"
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </div>

      {open && user && (
        <div className="md:hidden border-t border-white/10 px-5 py-3 flex flex-col gap-3 bg-[#141414]">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm text-[#A0A0A0]">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
