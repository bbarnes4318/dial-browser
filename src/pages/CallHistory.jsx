import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Home, Loader2, PhoneIncoming, PhoneOutgoing, PhoneMissed, ArrowLeft, Clock, Phone, Sparkles, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const STATUS_META = {
  completed: { label: "Completed", color: "#D1FF26", icon: PhoneOutgoing },
  in_progress: { label: "In progress", color: "#42E1F6", icon: PhoneIncoming },
  connecting: { label: "Connecting", color: "#42E1F6", icon: PhoneIncoming },
  ringing: { label: "Ringing", color: "#42E1F6", icon: PhoneIncoming },
  no_answer: { label: "No answer", color: "#fb923c", icon: PhoneMissed },
  failed: { label: "Failed", color: "#ef4444", icon: PhoneMissed },
  busy: { label: "Busy", color: "#fb923c", icon: PhoneMissed },
  voicemail: { label: "Voicemail", color: "#a78bfa", icon: PhoneMissed },
};

function fmtDuration(sec) {
  if (!sec || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function CallHistory() {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playRec, setPlayRec] = useState(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [rows, acct] = await Promise.all([
        base44.entities.PhoneCall.filter({ owner_user_id: user.id }, "-started_at", 200).catch(() => []),
        base44.functions.invoke("phone-account", {}).catch(() => null),
      ]);
      setCalls(Array.isArray(rows) ? rows : []);
      setAccount(acct?.data || acct);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#05070A" }}>
        <div className="text-center max-w-sm">
          <Phone size={28} className="mx-auto mb-4" style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>// SIGN IN REQUIRED</p>
          <Link to="/login" className="inline-block px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>Sign in</Link>
        </div>
      </div>
    );
  }

  const tier = account?.tier;
  const isPaid = tier && tier !== "free";

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}><Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} /></div>;
  }

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <header className="sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between"
        style={{ background: "rgba(5,7,10,0.9)", borderBottom: "0.5px solid rgba(209,255,38,0.15)", backdropFilter: "blur(12px)" }}>
        <Link to="/phone" className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase"
          style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
          <ArrowLeft size={12} /> Dial Phone
        </Link>
        <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// CALL HISTORY</p>
        <Link to="/" className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase"
          style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#8A8F98" }}>
          <Home size={12} /> Home
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6 pb-24">
        <div className="mb-5">
          <h1 className="font-heading font-black text-2xl sm:text-3xl" style={{ color: "#F5F5F7" }}>Call <span style={{ color: "#D1FF26" }}>History</span></h1>
          <p className="text-sm mt-1.5" style={{ color: "#8A8F98" }}>A log of your recent inbound and outbound calls.</p>
        </div>

        {!isPaid && (
          <div className="flex items-center gap-3 p-4 mb-5" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.3)", borderRadius: 10 }}>
            <Sparkles size={16} style={{ color: "#D1FF26" }} className="flex-shrink-0" />
            <p className="text-xs" style={{ color: "#F5F5F7" }}>Call history is a paid-member feature. <a href="/#pricing" className="underline font-bold" style={{ color: "#D1FF26" }}>Upgrade</a> to unlock full logs.</p>
          </div>
        )}

        {/* Summary chips */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Chip label="TOTAL" value={calls.length} color="#42E1F6" icon={Phone} />
          <Chip label="INBOUND" value={calls.filter((c) => c.direction === "inbound").length} color="#D1FF26" icon={PhoneIncoming} />
          <Chip label="OUTBOUND" value={calls.filter((c) => c.direction === "outbound").length} color="#fb923c" icon={PhoneOutgoing} />
        </div>

        {calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.15)", borderRadius: 12 }}>
            <Phone size={26} style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>NO CALLS YET</p>
          </div>
        ) : (
          <div className="space-y-2" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)", borderRadius: 12, overflow: "hidden" }}>
            {calls.map((c) => {
              const st = STATUS_META[c.status] || { label: c.status || "Unknown", color: "#8A8F98", icon: Phone };
              const SIcon = st.icon;
              const isIn = c.direction === "inbound";
              return (
                <div key={c.id} style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${st.color}12`, border: `0.5px solid ${st.color}40` }}>
                      <SIcon size={14} style={{ color: st.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs truncate" style={{ color: "#F5F5F7" }}>{c.remote_label || c.remote_number || "Unknown"}</p>
                        {c.recorded && <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest flex-shrink-0" style={{ color: "#ef4444" }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#ef4444" }} />REC</span>}
                      </div>
                      <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{isIn ? "Inbound" : "Outbound"} · {fmtDate(c.started_at || c.created_date)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-mono text-[9px] tracking-widest" style={{ color: st.color }}>{st.label.toUpperCase()}</span>
                      <p className="font-mono text-[9px] mt-0.5 flex items-center gap-1 justify-end" style={{ color: "#8A8F98" }}>
                        <Clock size={9} /> {fmtDuration(c.duration_seconds)}
                      </p>
                    </div>
                    {c.recording_url && (
                      <button onClick={() => setPlayRec(playRec === c.id ? null : c.id)} title="Play recording" className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                        <Play size={13} style={{ color: "#ef4444" }} />
                      </button>
                    )}
                  </div>
                  {c.recording_url && playRec === c.id && (
                    <div className="px-4 pb-3">
                      <audio controls src={c.recording_url} className="w-full" style={{ height: 36 }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ label, value, color, icon: Icon }) {
  return (
    <div className="p-3 flex items-center gap-3" style={{ background: "rgba(16,20,29,0.6)", border: `0.5px solid ${color}30`, borderRadius: 8 }}>
      <Icon size={14} style={{ color }} />
      <div>
        <p className="font-heading font-black text-xl leading-none" style={{ color: "#F5F5F7" }}>{value}</p>
        <p className="font-mono text-[8px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>{label}</p>
      </div>
    </div>
  );
}