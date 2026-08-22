import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { QrCode, Copy, Check, Clock, Coins } from "lucide-react";
import api, { formatError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const STATUS_COLORS = {
  approved: "text-[#10B981] bg-[#10B981]/15",
  submitted: "text-[#0055FF] bg-[#0055FF]/15",
  pending: "text-[#A0A0A0] bg-white/10",
  rejected: "text-[#EF4444] bg-[#EF4444]/15",
};

export default function Billing() {
  const { refresh } = useAuth();
  const [params] = useSearchParams();
  const kind = params.get("kind");
  const item = params.get("item");

  const [order, setOrder] = useState(null);
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  const loadHistory = () => api.get("/payments/mine").then(({ data }) => setHistory(data)).catch(() => {});

  useEffect(() => {
    loadHistory();
    if (kind && item) {
      api.post("/payments/upi/initiate", { kind, item_id: item })
        .then(({ data }) => setOrder(data))
        .catch((err) => toast.error(formatError(err.response?.data?.detail)));
    }
  }, [kind, item]);

  const submit = async () => {
    if (!utr.trim()) return toast.error("Enter the UPI transaction / reference ID");
    setBusy(true);
    try {
      await api.post("/payments/upi/submit", { payment_id: order.payment_id, utr });
      toast.success("Payment submitted! Credits are added after verification.");
      setOrder(null); setUtr(""); loadHistory(); refresh();
    } catch (err) {
      toast.error(formatError(err.response?.data?.detail));
    } finally { setBusy(false); }
  };

  const copyUpi = () => {
    navigator.clipboard.writeText(order.upi_id);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative z-10 max-w-[1000px] mx-auto px-5 py-10">
      <p className="label">Billing</p>
      <h1 className="display text-3xl font-semibold mb-8">Payments</h1>

      {order && (
        <div className="glass rounded-2xl p-6 mb-10" data-testid="upi-order">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <span className="label">Paying for</span>
              <h2 className="display text-2xl font-semibold">{order.label}</h2>
              <div className="flex items-center gap-1.5 text-[#FF4466] mt-1"><Coins size={15} /> {order.credits.toLocaleString()} credits</div>
              <p className="display text-4xl font-bold mt-4">₹{order.amount}</p>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[#A0A0A0]">UPI ID:</span>
                  <span className="font-mono">{order.upi_id}</span>
                  <button onClick={copyUpi} data-testid="copy-upi" className="p-1 hover:bg-white/10 rounded">
                    {copied ? <Check size={14} className="text-[#10B981]" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#A0A0A0]">Reference note:</span>
                  <span className="font-mono">{order.note}</span>
                </div>
              </div>

              <div className="mt-6 max-w-sm">
                <label className="label block mb-2">Enter UPI transaction / UTR ID after paying</label>
                <div className="flex gap-2">
                  <input
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    data-testid="utr-input"
                    placeholder="e.g. 4587XXXXXX21"
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#0055FF]"
                  />
                  <button onClick={submit} disabled={busy} data-testid="submit-utr" className="btn-gradient text-white font-semibold px-5 rounded-xl disabled:opacity-60">
                    {busy ? "…" : "Submit"}
                  </button>
                </div>
                <p className="text-xs text-[#A0A0A0] mt-2">Credits are added once the payment is verified (usually within minutes).</p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-white p-3 rounded-2xl">
                <img src={order.qr} alt="UPI QR" width={190} height={190} data-testid="upi-qr" />
              </div>
              <p className="text-xs text-[#A0A0A0] mt-2 flex items-center gap-1 justify-center"><QrCode size={13} /> Scan with any UPI app</p>
            </div>
          </div>
        </div>
      )}

      {!order && !kind && (
        <p className="text-[#A0A0A0] mb-10">Choose a plan or credit pack from the <a href="/pricing" className="text-[#FF4466] hover:underline">Pricing</a> page to make a payment.</p>
      )}

      {/* history */}
      <h2 className="display text-xl font-semibold mb-4">Payment history</h2>
      {history.length === 0 ? (
        <p className="text-[#A0A0A0]">No payments yet.</p>
      ) : (
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between bg-[#141414] border border-white/5 rounded-xl px-4 py-3" data-testid={`payment-${h.id}`}>
              <div>
                <p className="font-medium">{h.label}</p>
                <p className="text-xs text-[#A0A0A0] flex items-center gap-1"><Clock size={12} /> {new Date(h.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">₹{h.amount}</p>
                <span className={`text-[0.65rem] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[h.status] || "bg-white/10"}`}>
                  {h.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
