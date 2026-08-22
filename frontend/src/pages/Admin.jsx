import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, Coins, ShieldCheck } from "lucide-react";
import api, { formatError } from "../lib/api";

export default function Admin() {
  const [pending, setPending] = useState([]);

  const load = () => api.get("/admin/payments").then(({ data }) => setPending(data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    try {
      await api.post(`/admin/payments/${id}/${action}`);
      toast.success(action === "approve" ? "Approved & credits added" : "Rejected");
      load();
    } catch (err) { toast.error(formatError(err.response?.data?.detail)); }
  };

  return (
    <div className="relative z-10 max-w-[1000px] mx-auto px-5 py-10">
      <div className="flex items-center gap-2 mb-1"><ShieldCheck size={18} className="text-[#0055FF]" /><span className="label">Admin</span></div>
      <h1 className="display text-3xl font-semibold mb-8">Payment approvals</h1>

      {pending.length === 0 ? (
        <p className="text-[#A0A0A0]">No payments awaiting review.</p>
      ) : (
        <div className="space-y-3">
          {pending.map((p) => (
            <div key={p.id} className="bg-[#141414] border border-white/5 rounded-xl px-5 py-4 flex items-center justify-between flex-wrap gap-4" data-testid={`admin-payment-${p.id}`}>
              <div>
                <p className="font-medium">{p.label}</p>
                <p className="text-xs text-[#A0A0A0]">{p.user_email}</p>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="text-[#FF4466] flex items-center gap-1"><Coins size={13} /> {p.credits}</span>
                  <span>₹{p.amount}</span>
                  {p.utr && <span className="font-mono text-xs text-[#A0A0A0]">UTR: {p.utr}</span>}
                  <span className={`text-[0.6rem] px-2 py-0.5 rounded-full ${p.status === "submitted" ? "bg-[#0055FF]/15 text-[#0055FF]" : "bg-white/10 text-[#A0A0A0]"}`}>{p.status.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => act(p.id, "approve")} data-testid={`approve-${p.id}`} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 transition-colors text-sm font-semibold">
                  <Check size={15} /> Approve
                </button>
                <button onClick={() => act(p.id, "reject")} data-testid={`reject-${p.id}`} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EF4444]/15 text-[#EF4444] hover:bg-[#EF4444]/25 transition-colors text-sm font-semibold">
                  <X size={15} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
