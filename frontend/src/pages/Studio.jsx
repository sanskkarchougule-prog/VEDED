import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ImageIcon, Video, Mic, MessageSquareText, Wand2, Download, Share2, Coins, Loader2,
} from "lucide-react";
import api, { formatError, mediaUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { id: "image", label: "Image", icon: ImageIcon, live: true },
  { id: "video", label: "Video", icon: Video, live: false },
  { id: "audio", label: "Audio", icon: Mic, live: false },
  { id: "story", label: "Prompt Lab", icon: MessageSquareText, live: true },
];

const RATIOS = [
  { id: "1:1", w: 1024, h: 1024, label: "Square" },
  { id: "16:9", w: 1344, h: 768, label: "Wide" },
  { id: "9:16", w: 768, h: 1344, label: "Portrait" },
];

const STYLES = ["Cinematic", "Photorealistic", "Anime", "3D Render", "Cyberpunk", "Oil Painting", "Fantasy Art"];

export default function Studio() {
  const { user, setCredits } = useAuth();
  const [tab, setTab] = useState("image");
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("flux-dev");
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState("");
  const [ratio, setRatio] = useState(RATIOS[0]);
  const [style, setStyle] = useState("Cinematic");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  // story
  const [chat, setChat] = useState("");
  const [chatReply, setChatReply] = useState("");

  useEffect(() => {
    api.get("/config").then(({ data }) => setModels(data.image_models)).catch(() => {});
  }, []);

  const activeModel = models.find((m) => m.id === model);

  const generate = async () => {
    if (!prompt.trim()) return toast.error("Enter a prompt first");
    setBusy(true);
    setResult(null);
    try {
      const finalPrompt = `${prompt.trim()}, ${style} style`;
      const { data } = await api.post("/generate/image", {
        prompt: finalPrompt, model, width: ratio.w, height: ratio.h, negative_prompt: negative,
      });
      setResult({ id: data.id, url: mediaUrl(data.url), prompt: finalPrompt });
      setCredits(data.credits);
      toast.success(`Image ready · -${data.cost} credits`);
    } catch (err) {
      toast.error(formatError(err.response?.data?.detail) || "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!result) return;
    try {
      await api.post("/publish", { media_id: result.id, title: prompt.slice(0, 60), category: style + " Art" });
      toast.success("Published to Discover feed!");
    } catch (err) {
      toast.error(formatError(err.response?.data?.detail));
    }
  };

  const runVideo = async () => {
    try {
      await api.post("/generate/video", {});
    } catch (err) {
      toast.info(formatError(err.response?.data?.detail));
    }
  };

  const runChat = async () => {
    if (!chat.trim()) return;
    setBusy(true);
    setChatReply("");
    try {
      const { data } = await api.post("/chat", { message: chat });
      setChatReply(data.reply);
      setCredits(data.credits);
    } catch (err) {
      toast.error(formatError(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative z-10 max-w-[1400px] mx-auto px-5 py-8">
      {/* header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="label">AI Creative Studio</p>
          <h1 className="display text-3xl font-semibold">Generate</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10" data-testid="studio-credits">
          <Coins size={16} className="text-[#FF4466]" />
          <span className="font-semibold">{user?.credits}</span>
          <span className="text-[#A0A0A0] text-sm">&nbsp;credits</span>
        </div>
      </div>

      {/* tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            data-testid={`studio-tab-${t.id}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors ${
              tab === t.id ? "bg-white/10 border-white/20 text-[#F0F0F0]" : "bg-transparent border-white/5 text-[#A0A0A0] hover:bg-white/5"
            }`}
          >
            <t.icon size={15} />
            {t.label}
            {!t.live && <span className="text-[0.55rem] px-1.5 py-0.5 rounded-full bg-white/10">SOON</span>}
          </button>
        ))}
      </div>

      {tab === "image" && (
        <div className="grid lg:grid-cols-[340px_1fr] gap-4">
          {/* sidebar */}
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-5 h-fit">
            <div>
              <label className="label block mb-2">Model</label>
              <div className="grid grid-cols-1 gap-2">
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    data-testid={`model-${m.id}`}
                    className={`text-left px-3 py-2.5 rounded-xl border transition-colors ${
                      model === m.id ? "border-[#FF4466] bg-[#FF4466]/10" : "border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{m.label}</span>
                      <span className="text-xs text-[#A0A0A0]">{m.credits} cr</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label block mb-2">Aspect ratio</label>
              <div className="grid grid-cols-3 gap-2">
                {RATIOS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRatio(r)}
                    data-testid={`ratio-${r.id}`}
                    className={`py-2 rounded-xl border text-xs transition-colors ${
                      ratio.id === r.id ? "border-[#0055FF] bg-[#0055FF]/10" : "border-white/10 hover:bg-white/5"
                    }`}
                  >
                    {r.id}
                    <div className="text-[0.6rem] text-[#A0A0A0]">{r.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label block mb-2">Style</label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    data-testid={`style-${s.toLowerCase().replace(/\s/g, "-")}`}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      style === s ? "border-[#FF4466] bg-[#FF4466]/10 text-[#F0F0F0]" : "border-white/10 text-[#A0A0A0] hover:bg-white/5"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label block mb-2">Negative prompt (optional)</label>
              <textarea
                value={negative}
                onChange={(e) => setNegative(e.target.value)}
                data-testid="negative-prompt"
                placeholder="blurry, low quality, distorted"
                rows={2}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0055FF] resize-none"
              />
            </div>
          </div>

          {/* canvas */}
          <div className="space-y-4">
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                data-testid="prompt-input"
                placeholder="Describe what you want to create… e.g. a lone astronaut on a neon-lit alien beach at dusk"
                rows={3}
                className="w-full bg-transparent text-lg placeholder:text-[#555] focus:outline-none resize-none"
              />
              <div className="flex justify-between items-center pt-3 border-t border-white/5">
                <span className="text-sm text-[#A0A0A0]">
                  {activeModel ? `${activeModel.credits} credits · ${activeModel.label}` : ""}
                </span>
                <button
                  onClick={generate}
                  disabled={busy}
                  data-testid="generate-btn"
                  className="btn-gradient text-white font-semibold px-6 py-2.5 rounded-full flex items-center gap-2 disabled:opacity-60"
                >
                  {busy ? <Loader2 size={17} className="animate-spin" /> : <Wand2 size={17} />}
                  {busy ? "Generating…" : "Generate"}
                </button>
              </div>
            </div>

            <div className="bg-[#141414] border border-white/5 rounded-2xl aspect-video flex items-center justify-center overflow-hidden relative">
              {busy && (
                <div className="absolute inset-0 bg-white/5 animate-pulse flex flex-col items-center justify-center gap-3">
                  <Loader2 size={30} className="animate-spin text-[#FF4466]" />
                  <p className="text-sm text-[#A0A0A0]">Rendering with FLUX.1…</p>
                </div>
              )}
              {!busy && result && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={result.url}
                  alt={result.prompt}
                  data-testid="result-image"
                  className="w-full h-full object-contain"
                />
              )}
              {!busy && !result && (
                <div className="text-center text-[#555]">
                  <ImageIcon size={40} className="mx-auto mb-3" />
                  <p className="text-sm">Your generated image appears here</p>
                </div>
              )}
            </div>

            {result && !busy && (
              <div className="flex gap-3">
                <a
                  href={result.url}
                  download={`veded-${result.id}.jpg`}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="download-btn"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm"
                >
                  <Download size={16} /> Download
                </a>
                <button
                  onClick={publish}
                  data-testid="publish-btn"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm"
                >
                  <Share2 size={16} /> Publish to Discover
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "story" && (
        <div className="max-w-3xl bg-[#141414] border border-white/5 rounded-2xl p-6">
          <p className="text-[#A0A0A0] mb-4 text-sm">
            Prompt Lab — describe an idea and VEDED's assistant will craft a vivid, generation-ready prompt (1 credit).
          </p>
          <textarea
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            data-testid="chat-input"
            rows={3}
            placeholder="e.g. help me write a cinematic prompt about a floating city in the clouds"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#0055FF] resize-none"
          />
          <button
            onClick={runChat}
            disabled={busy}
            data-testid="chat-send"
            className="btn-gradient text-white font-semibold px-6 py-2.5 rounded-full mt-3 flex items-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />} Ask assistant
          </button>
          {chatReply && (
            <div className="mt-5 p-4 rounded-xl bg-black/40 border border-white/10 whitespace-pre-wrap text-[#F0F0F0]" data-testid="chat-reply">
              {chatReply}
            </div>
          )}
        </div>
      )}

      {(tab === "video" || tab === "audio") && (
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-12 text-center max-w-2xl">
          {tab === "video" ? <Video size={38} className="mx-auto text-[#FF4466] mb-4" /> : <Mic size={38} className="mx-auto text-[#FF4466] mb-4" />}
          <h3 className="display text-2xl font-semibold mb-2">{tab === "video" ? "AI Video" : "AI Audio & Audiobooks"} — Coming soon</h3>
          <p className="text-[#A0A0A0] mb-6">
            {tab === "video"
              ? "Wan 2.2 cinematic video needs dedicated GPU capacity. We're provisioning it — you'll be notified the moment it's live. No credits are used until then."
              : "Sarvam & Riva powered narration and audiobooks are on the way."}
          </p>
          {tab === "video" && (
            <button onClick={runVideo} data-testid="video-notify" className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm">
              Check availability
            </button>
          )}
        </div>
      )}
    </div>
  );
}
