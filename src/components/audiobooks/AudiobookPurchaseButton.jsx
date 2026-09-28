import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Download, Lock } from "lucide-react";

function fileSafe(name) {
  return (name || "audiobook").replace(/[^a-z0-9 _-]/gi, "").trim().replace(/\s+/g, "_") || "audiobook";
}

// Renders the purchase / unlock state for a paid audiobook:
//  - owned (status paid): a full-width "Download Full Chapter" link
//  - not owned: a "Buy $X.XX" button that initiates a Wix checkout via create-checkout
// Free audiobooks (price <= 0) render nothing here — the Library's free download
// icon handles those.
export default function AudiobookPurchaseButton({ book, owned, user }) {
  const price = parseFloat(book.price) || 0;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (price <= 0) return null;

  if (owned) {
    return (
      <a
        href={`/functions/download-audiobook?id=${book.id}`}
        download={`${fileSafe(book.title)}.mp3`}
        className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[9px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.3)]"
        style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}
      >
        <Download size={12} /> Download Full Chapter
      </a>
    );
  }

  const buy = async () => {
    if (!user) {
      window.location.href = `/login?returnTo=/library`;
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const res = await base44.functions.invoke("create-checkout", {
        plan: "audiobook",
        audiobook_id: book.id,
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
      });
      const data = res?.data || res;
      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setErr(data?.error || "Checkout failed. Please try again.");
    } catch (e) {
      if (e?.response?.status === 401) {
        window.location.href = `/login?returnTo=/library`;
        return;
      }
      setErr(e?.response?.data?.error || e?.message || "Checkout failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={buy}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[9px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.3)] disabled:opacity-60"
        style={{ background: "#D1FF26", color: "#05070A" }}
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
        {busy ? "Redirecting…" : `Buy $${price.toFixed(2)}`}
      </button>
      {err && <p className="mt-1.5 font-mono text-[8px] tracking-wider" style={{ color: "#ef4444" }}>{err}</p>}
    </div>
  );
}