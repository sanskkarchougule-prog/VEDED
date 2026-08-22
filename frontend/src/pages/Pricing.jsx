import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Zap, Coins } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Pricing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => { api.get("/pricing").then(({ data }) => setData(data)).catch(() => {}); }, []);

  const choosePlan = (plan) => {
    if (plan.price === 0) { nav(user ? "/studio" : "/register"); return; }
    if (!user) { nav("/register"); return; }
    nav(`/billing?kind=plan&item=${plan.id}`);
  };
  const choosePack = (pack) => nav(user ? `/billing?kind=pack&item=${pack.id}` : "/register");

  return (
    <div className="relative z-10 max-w-[1400px] mx-auto px-5 py-12">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="label">Pricing</span>
        <h1 className="display text-4xl md:text-5xl font-bold mt-3">Simple credits. Serious creation.</h1>
        <p className="text-[#A0A0A0] mt-4">Every plan runs on one credit balance across all AI modes. Cancel anytime.</p>
      </div>

      {/* plans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {data?.plans.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            data-testid={`plan-${p.id}`}
            className={`relative rounded-2xl p-6 border ${
              p.popular ? "glass border-[#FF4466]/40" : "bg-[#141414] border-white/5"
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-6 btn-gradient text-white text-[0.65rem] font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </span>
            )}
            <h3 className="display text-xl font-semibold">{p.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="display text-4xl font-bold">₹{p.price}</span>
              {p.price > 0 && <span className="text-[#A0A0A0] text-sm">/mo</span>}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-sm text-[#FF4466]">
              <Coins size={14} /> {p.credits.toLocaleString()} credits
            </div>
            <ul className="mt-5 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-[#A0A0A0]">
                  <Check size={16} className="text-[#10B981] mt-0.5 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => choosePlan(p)}
              data-testid={`plan-cta-${p.id}`}
              className={`w-full mt-6 py-3 rounded-xl font-semibold transition-colors ${
                p.popular ? "btn-gradient text-white" : "bg-white/5 border border-white/10 hover:bg-white/10"
              }`}
            >
              {p.price === 0 ? "Start free" : "Choose " + p.name}
            </button>
          </motion.div>
        ))}
      </div>

      {/* credit packs */}
      <div className="mt-16">
        <h2 className="display text-2xl font-semibold mb-2">Top-up credit packs</h2>
        <p className="text-[#A0A0A0] mb-6">One-time boosts — no subscription required.</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {data?.credit_packs.map((pk) => (
            <div key={pk.id} className="card-hover bg-[#141414] border border-white/5 rounded-2xl p-6 flex items-center justify-between" data-testid={`pack-${pk.id}`}>
              <div>
                <div className="flex items-center gap-1.5 text-[#FF4466]"><Zap size={16} /><span className="display text-2xl font-bold">{pk.credits.toLocaleString()}</span></div>
                <p className="text-sm text-[#A0A0A0]">credits</p>
              </div>
              <div className="text-right">
                <p className="display text-xl font-semibold">₹{pk.price}</p>
                <button onClick={() => choosePack(pk)} data-testid={`pack-cta-${pk.id}`} className="mt-2 text-sm btn-gradient text-white px-4 py-1.5 rounded-full font-semibold">
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
