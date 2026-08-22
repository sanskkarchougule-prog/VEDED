import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, X, Play } from "lucide-react";
import api, { mediaUrl } from "../lib/api";

export default function Reels() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/discover").then(({ data }) => setItems(data.items)).catch(() => {});
  }, []);

  const reels = items.length
    ? items
    : [
        { id: "demo1", url: null, title: "AI Reel", owner_name: "VEDED", img: "https://images.pexels.com/photos/7825865/pexels-photo-7825865.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
        { id: "demo2", url: null, title: "AI Reel", owner_name: "VEDED", img: "https://images.pexels.com/photos/8484154/pexels-photo-8484154.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
      ];

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] z-50">
      <button onClick={() => nav("/studio")} data-testid="reels-close" className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 backdrop-blur hover:bg-black/70 transition-colors">
        <X size={22} />
      </button>
      <div className="h-full overflow-y-scroll snap-y-container no-scrollbar">
        {reels.map((r) => (
          <div key={r.id} className="snap-item h-screen w-full flex items-center justify-center relative" data-testid={`reel-${r.id}`}>
            <div className="relative h-full max-w-[440px] w-full mx-auto">
              <img src={r.url ? mediaUrl(r.url) : r.img} alt={r.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
              {!r.url && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center"><Play size={26} /></div>
                </div>
              )}
              <div className="absolute right-3 bottom-28 flex flex-col gap-6 items-center">
                <Action icon={Heart} label="1.2k" />
                <Action icon={MessageCircle} label="84" />
                <Action icon={Share2} label="Share" />
              </div>
              <div className="absolute left-4 bottom-8 right-16">
                <p className="font-semibold">@{(r.owner_name || "veded").toLowerCase().replace(/\s/g, "")}</p>
                <p className="text-sm text-[#E0E0E0] mt-1 line-clamp-2">{r.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Action({ icon: Icon, label }) {
  return (
    <button className="flex flex-col items-center gap-1 text-white">
      <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition-colors">
        <Icon size={20} />
      </div>
      <span className="text-xs">{label}</span>
    </button>
  );
}
