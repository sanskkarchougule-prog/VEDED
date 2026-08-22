import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ImageIcon, Video, Mic, Film, Clapperboard, BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const modes = [
  { icon: ImageIcon, title: "AI Images", desc: "FLUX.1 text-to-image in seconds", live: true },
  { icon: Video, title: "AI Video", desc: "Wan 2.2 cinematic clips", live: false },
  { icon: Mic, title: "Audiobooks", desc: "Lifelike narration & voices", live: false },
  { icon: Film, title: "Movies", desc: "Long-form AI cinema", live: false },
  { icon: Clapperboard, title: "Web Series", desc: "Episodic AI storytelling", live: false },
  { icon: BookOpen, title: "Bookstream", desc: "Upload & monetize content", live: false },
];

const heroImg =
  "https://images.unsplash.com/photo-1672872476232-da16b45c9001?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwyfHxjeWJlcnB1bmslMjBjaXR5JTIwYXJ0fGVufDB8fHx8MTc4NzM3NTQyN3ww&ixlib=rb-4.1.0&q=85";

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="relative z-10 overflow-hidden">
      {/* Hero */}
      <section className="relative max-w-[1400px] mx-auto px-5 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
            <Sparkles size={14} className="text-[#FF4466]" />
            <span className="label !text-[0.65rem] !text-[#F0F0F0]">One studio · every AI medium</span>
          </div>
          <h1 className="display text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Create <span className="gradient-text">images, video, audio</span> & stream it to the world.
          </h1>
          <p className="mt-6 text-lg text-[#A0A0A0] max-w-lg leading-relaxed">
            VEDED is your AI creative studio and streaming platform. Generate stunning visuals,
            publish to a cinematic feed, and earn from every subscription.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              to={user ? "/studio" : "/register"}
              data-testid="hero-cta"
              className="btn-gradient text-white font-semibold px-7 py-3.5 rounded-full flex items-center gap-2"
            >
              {user ? "Open Studio" : "Start creating free"} <ArrowRight size={18} />
            </Link>
            <Link
              to="/discover"
              data-testid="hero-discover"
              className="px-7 py-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-medium"
            >
              Explore the feed
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-[#A0A0A0]">
            <span>✦ 60 free credits</span>
            <span>✦ No card needed</span>
            <span>✦ FLUX.1 powered</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          <div className="absolute -inset-6 bg-gradient-to-tr from-[#FF4466]/20 to-[#0055FF]/20 blur-3xl rounded-full" />
          <img
            src={heroImg}
            alt="AI generated cyberpunk city"
            className="relative rounded-2xl border border-white/10 w-full object-cover aspect-[4/3] shadow-2xl shadow-black/60"
          />
          <div className="absolute bottom-4 left-4 glass rounded-xl px-4 py-2.5">
            <p className="label">Generated with</p>
            <p className="text-sm font-semibold">FLUX.1 · VEDED Studio</p>
          </div>
        </motion.div>
      </section>

      {/* Modes */}
      <section className="max-w-[1400px] mx-auto px-5 pb-24">
        <h2 className="display text-3xl font-semibold mb-2">Six creative modes. One credit balance.</h2>
        <p className="text-[#A0A0A0] mb-10">Start with AI images today — video, audio and long-form cinema are rolling out.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modes.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card-hover bg-[#141414] border border-white/5 rounded-2xl p-6"
              data-testid={`mode-card-${m.title.toLowerCase().replace(/\s/g, "-")}`}
            >
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <m.icon size={20} className="text-[#FF4466]" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{m.title}</h3>
                {m.live ? (
                  <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] font-semibold">LIVE</span>
                ) : (
                  <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-white/10 text-[#A0A0A0] font-semibold">SOON</span>
                )}
              </div>
              <p className="text-sm text-[#A0A0A0] mt-1.5">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
