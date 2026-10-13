import React, { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { useHoppwhistleVoice } from "@/telephony/hoppwhistle/HoppwhistleVoiceProvider";

/**
 * Link the Hoppwhistle agent account this phone calls as. Shown only while the
 * phone has no Hoppwhistle session; the password goes straight to Hoppwhistle
 * and is never stored.
 */
export default function HoppwhistleConnectCard({ compact = false }) {
  const voice = useHoppwhistleVoice();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await voice.signIn(email, password);
    setBusy(false);
    if (res.ok) setPassword("");
  };

  return (
    <form onSubmit={submit} className={`w-full ${compact ? "max-w-[340px]" : ""} p-4 mb-4`}
      style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.25)", borderRadius: 10 }}>
      <p className="font-mono text-[9px] tracking-[0.4em] mb-1" style={{ color: "#D1FF26" }}>// CONNECT PHONE</p>
      <p className="text-[11px] mb-3 leading-snug" style={{ color: "#8A8F98" }}>
        Calls are placed through your Hoppwhistle agent account. Sign in with it once to bring this phone online.
      </p>
      <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="Hoppwhistle email" className="w-full mb-2 px-3 py-2 text-xs outline-none bg-transparent"
        style={{ border: "0.5px solid rgba(138,143,152,0.3)", color: "#F5F5F7" }} />
      <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
        placeholder="Password" className="w-full mb-3 px-3 py-2 text-xs outline-none bg-transparent"
        style={{ border: "0.5px solid rgba(138,143,152,0.3)", color: "#F5F5F7" }} />
      <button type="submit" disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-2 font-mono text-[10px] tracking-widest uppercase disabled:opacity-50"
        style={{ background: "#D1FF26", color: "#05070A" }}>
        {busy ? <Loader2 size={12} className="animate-spin" /> : <LogIn size={12} />} Connect
      </button>
    </form>
  );
}
