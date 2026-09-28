import React, { useState } from "react";
import { Mail, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Final dating-profile step: email the member a 6-digit code and activate the
// profile only once the code is confirmed. Uses the send-dating-verification
// and verify-dating-email backend functions.
export default function EmailVerification({ emailHint, onVerified }) {
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [sent, setSent] = useState(false);

  const sendCode = async () => {
    setError("");
    setInfo("");
    setSending(true);
    try {
      const res = await base44.functions.invoke("send-dating-verification", {});
      if (res && res.data && res.data.already_verified) {
        onVerified();
        return;
      }
      setSent(true);
      setInfo(res && res.data ? `Code sent to ${res.data.sent_to || emailHint}.` : "Code sent.");
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.error) || err.message || "Could not send code.");
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setVerifying(true);
    try {
      const res = await base44.functions.invoke("verify-dating-email", { code });
      if (res && res.data && (res.data.verified || res.data.already_verified)) {
        onVerified();
      } else {
        setError("Could not verify. Try again.");
      }
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.error) || err.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// VERIFY YOUR EMAIL</p>
      </div>
      <p className="text-sm mb-4" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
        For everyone's safety, every dating member must verify their email. We'll send a 6-digit code to your account email — your profile stays hidden until verified.
      </p>
      {info && <div className="mb-3 p-3 text-xs flex items-center gap-2" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#D1FF26" }}><Mail size={12} /> {info}</div>}
      {error && <div className="mb-3 p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>{error}</div>}
      {!sent ? (
        <button onClick={sendCode} disabled={sending} className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
          {sending ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />} Send Verification Code
        </button>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit code"
            className="w-full p-3 text-center text-2xl tracking-[0.4em] outline-none"
            style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
          />
          <button onClick={verify} disabled={verifying} className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
            {verifying ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />} Verify & Activate
          </button>
          <button onClick={sendCode} disabled={sending} className="w-full flex items-center justify-center gap-2 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>
            <RefreshCw size={11} /> Resend code
          </button>
        </div>
      )}
    </div>
  );
}