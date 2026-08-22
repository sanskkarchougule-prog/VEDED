import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import api, { formatError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const bg =
  "https://images.pexels.com/photos/29579756/pexels-photo-29579756.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function Auth({ mode }) {
  const isLogin = mode === "login";
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const path = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : form;
      const { data } = await api.post(path, payload);
      login(data.token, data.user);
      toast.success(isLogin ? "Welcome back!" : "Account created — 60 free credits added!");
      nav("/studio");
    } catch (err) {
      toast.error(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative z-10 min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
        <div className="absolute bottom-10 left-10 max-w-sm">
          <h2 className="display text-3xl font-semibold leading-tight">
            Where imagination becomes a <span className="gradient-text">cinematic feed.</span>
          </h2>
          <p className="text-[#A0A0A0] mt-3">Generate, publish and monetize AI content on VEDED.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-md btn-gradient flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="display text-2xl font-semibold">VEDED</span>
          </div>

          <h1 className="display text-3xl font-semibold">{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p className="text-[#A0A0A0] mt-2 mb-8">
            {isLogin ? "Log in to continue creating." : "Get 60 free credits to start generating."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {!isLogin && (
              <Field label="Name" value={form.name} testid="auth-name"
                onChange={(v) => setForm({ ...form, name: v })} placeholder="Your name" />
            )}
            <Field label="Email" type="email" value={form.email} testid="auth-email"
              onChange={(v) => setForm({ ...form, email: v })} placeholder="you@email.com" required />
            <Field label="Password" type="password" value={form.password} testid="auth-password"
              onChange={(v) => setForm({ ...form, password: v })} placeholder="••••••••" required />

            <button
              type="submit"
              disabled={busy}
              data-testid="auth-submit"
              className="btn-gradient w-full text-white font-semibold py-3 rounded-xl disabled:opacity-60 mt-2"
            >
              {busy ? "Please wait…" : isLogin ? "Log in" : "Create account"}
            </button>
          </form>

          <p className="text-sm text-[#A0A0A0] mt-6 text-center">
            {isLogin ? "New to VEDED? " : "Already have an account? "}
            <Link to={isLogin ? "/register" : "/login"} className="text-[#FF4466] hover:underline" data-testid="auth-switch">
              {isLogin ? "Create an account" : "Log in"}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required, testid }) {
  return (
    <div>
      <label className="label block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        data-testid={testid}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[#F0F0F0] placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#0055FF] transition-shadow"
      />
    </div>
  );
}
