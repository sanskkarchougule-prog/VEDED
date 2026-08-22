import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ImageIcon, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import api, { mediaUrl, formatError } from "../lib/api";

export default function Gallery() {
  const [items, setItems] = useState(null);

  const load = () => api.get("/gallery").then(({ data }) => setItems(data)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const publish = async (id, title) => {
    try {
      await api.post("/publish", { media_id: id, title, category: "AI Art" });
      toast.success("Published to Discover!");
      load();
    } catch (err) { toast.error(formatError(err.response?.data?.detail)); }
  };

  return (
    <div className="relative z-10 max-w-[1400px] mx-auto px-5 py-8">
      <p className="label">Your creations</p>
      <h1 className="display text-3xl font-semibold mb-8">Gallery</h1>

      {items === null && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {items && items.length === 0 && (
        <div className="text-center py-24 text-[#A0A0A0]">
          <ImageIcon size={40} className="mx-auto mb-4" />
          <p className="mb-4">No creations yet.</p>
          <Link to="/studio" className="btn-gradient text-white px-6 py-2.5 rounded-full font-semibold">Open Studio</Link>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((it, i) => (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card-hover group relative rounded-2xl overflow-hidden border border-white/5 bg-[#141414]"
              data-testid={`gallery-item-${it.id}`}
            >
              <img src={mediaUrl(it.url)} alt={it.prompt} className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-xs text-[#F0F0F0] line-clamp-2 mb-2">{it.prompt}</p>
                {!it.published ? (
                  <button
                    onClick={() => publish(it.id, it.title)}
                    data-testid={`publish-${it.id}`}
                    className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full w-fit transition-colors"
                  >
                    <Share2 size={13} /> Publish
                  </button>
                ) : (
                  <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] w-fit font-semibold">PUBLISHED</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
