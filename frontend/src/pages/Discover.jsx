import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import api, { mediaUrl } from "../lib/api";

const FALLBACK = [
  { name: "AI Cinema", img: "https://images.pexels.com/photos/8271453/pexels-photo-8271453.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", tag: "Movies" },
  { name: "Web Series", img: "https://images.unsplash.com/photo-1695114584354-13e1910d491b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHNjZW5lfGVufDB8fHx8MTc4NzM3NTQyN3ww&ixlib=rb-4.1.0&q=85", tag: "Series" },
  { name: "Audiobooks", img: "https://images.pexels.com/photos/31213674/pexels-photo-31213674.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", tag: "Audio" },
  { name: "Reels", img: "https://images.pexels.com/photos/7825865/pexels-photo-7825865.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", tag: "Shorts" },
];

const heroImg = "https://images.pexels.com/photos/31413138/pexels-photo-31413138.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function Discover() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/discover").then(({ data }) => setData(data)).catch(() => setData({ categories: [], items: [] })); }, []);

  return (
    <div className="relative z-10">
      {/* hero banner */}
      <div className="relative h-[46vh] min-h-[340px] overflow-hidden">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/80 to-transparent" />
        <div className="relative z-10 max-w-[1400px] mx-auto px-5 h-full flex flex-col justify-end pb-10">
          <span className="label mb-2">Featured on VEDED</span>
          <h1 className="display text-4xl md:text-5xl font-bold max-w-xl">A cinematic feed, made entirely by AI.</h1>
          <p className="text-[#A0A0A0] mt-3 max-w-lg">Browse community creations, watch AI shorts, and stream premium content with a subscription.</p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 py-10 space-y-12">
        {/* categories row */}
        <div>
          <h2 className="display text-2xl font-semibold mb-4">Browse categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FALLBACK.map((c) => (
              <div key={c.name} className="card-hover relative rounded-2xl overflow-hidden border border-white/5 aspect-[4/3]" data-testid={`category-${c.tag.toLowerCase()}`}>
                <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent flex flex-col justify-end p-4">
                  <span className="label">{c.tag}</span>
                  <span className="text-lg font-semibold">{c.name}</span>
                  <span className="text-[0.6rem] mt-1 text-[#A0A0A0]">Coming soon</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* published community art */}
        <div>
          <h2 className="display text-2xl font-semibold mb-4">Community creations</h2>
          {data === null && (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="min-w-[220px] aspect-square rounded-2xl bg-white/5 animate-pulse" />)}
            </div>
          )}
          {data && data.items.length === 0 && (
            <p className="text-[#A0A0A0]">No published creations yet. Be the first — generate in the Studio and hit Publish!</p>
          )}
          {data && data.items.length > 0 && (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {data.items.map((it, i) => (
                <motion.div
                  key={it.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="card-hover group relative min-w-[220px] w-[220px] rounded-2xl overflow-hidden border border-white/5"
                  data-testid={`discover-item-${it.id}`}
                >
                  <img src={mediaUrl(it.url)} alt={it.title} className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={30} className="text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs font-medium line-clamp-1">{it.title}</p>
                    <p className="text-[0.65rem] text-[#A0A0A0]">by {it.owner_name || "Creator"}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
