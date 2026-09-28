import React, { useState, useEffect } from "react";
import { Bell, BellOff, Loader2, Check, Phone, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";

const LIME = "#D4FF00";

// Sports a user can subscribe to for live-broadcast alerts. Matches the
// quick-pick tiles in the Dial Sports infotainment unit.
const ALERT_SPORTS = [
  { id: "soccer", label: "Soccer", glyph: "⚽", accent: "#39FF14" },
  { id: "football", label: "Football", glyph: "🏈", accent: "#5A8FE0" },
  { id: "baseball", label: "Baseball", glyph: "⚾", accent: "#9AE05A" },
  { id: "basketball", label: "Basketball", glyph: "🏀", accent: "#FF8C42" },
  { id: "motorsport", label: "Motorsport", glyph: "🏎️", accent: "#E0C45A" },
];

export default function SportsAlerts() {
  const [user, setUser] = useState(null);
  const [subs, setSubs] = useState([]); // existing SportsAlert records
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // sport id being toggled
  const [error, setError] = useState(null);
  const [justOn, setJustOn] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        try { await base44.auth.updateMe({}); } catch {}
        const existing = await base44.entities.SportsAlert.filter({ owner_user_id: me.id });
        setSubs(existing);
        const withPhone = existing.find((s) => s.phone);
        if (withPhone) setPhone(withPhone.phone);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isOn = (sportId) => subs.some((s) => s.sport === sportId && s.active);

  const toggle = async (sportId) => {
    if (!user) { openRegistrationModal(); return; }
    setError(null);
    setBusy(sportId);
    try {
      const existing = subs.find((s) => s.sport === sportId);
      if (existing) {
        await base44.entities.SportsAlert.delete(existing.id);
        setSubs((prev) => prev.filter((s) => s.id !== existing.id));
        setJustOn(null);
      } else {
        const created = await base44.entities.SportsAlert.create({
          owner_user_id: user.id,
          sport: sportId,
          phone: phone.trim(),
          notify_sms: !!phone.trim(),
          notify_in_app: true,
          active: true,
        });
        setSubs((prev) => [...prev, created]);
        setJustOn(sportId);
        setTimeout(() => setJustOn((j) => (j === sportId ? null : j)), 1800);
      }
    } catch (e) {
      setError("Could not update alerts. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const savePhone = async () => {
    if (!user) return;
    setError(null);
    try {
      // Update existing subscriptions with the new phone number.
      if (subs.length) {
        await base44.entities.SportsAlert.bulkUpdate(
          subs.map((s) => ({ id: s.id, phone: phone.trim(), notify_sms: !!phone.trim() }))
        );
        setSubs((prev) => prev.map((s) => ({ ...s, phone: phone.trim(), notify_sms: !!phone.trim() })));
      }
    } catch {
      setError("Could not save phone number.");
    }
  };

  return (
    <div className="mt-5 p-4" style={{ borderRadius: 10, background: "linear-gradient(180deg,#0d0d0d,#141414)", border: "0.5px solid rgba(255,255,255,0.06)", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.7)" }}>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-3">
        <Bell size={11} style={{ color: LIME }} />
        <p className="font-mono text-[9px] tracking-[0.2em]" style={{ color: LIME }}>GAME ALERTS · GET NOTIFIED WHEN THE BROADCAST STARTS</p>
      </div>
      <p className="text-[10px] leading-relaxed mb-4" style={{ color: "#9a9a9a" }}>
        Pick the sports you care about and we'll ping you the moment live coverage kicks off on our sports radio network. Toggle a sport on to subscribe.
      </p>

      {error && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2" style={{ background: "rgba(239,68,68,0.12)", border: "0.5px solid rgba(239,68,68,0.45)", borderRadius: 5 }}>
          <AlertCircle size={12} style={{ color: "#ef4444" }} />
          <p className="text-[10px]" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      {/* Sport toggles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {ALERT_SPORTS.map((sp) => {
          const on = isOn(sp.id);
          const isBusy = busy === sp.id;
          const justSubscribed = justOn === sp.id;
          return (
            <button
              key={sp.id}
              onClick={() => toggle(sp.id)}
              disabled={isBusy}
              className="relative flex flex-col items-center justify-center py-3 px-1 transition-transform active:scale-95"
              style={{
                borderRadius: 7,
                background: on ? `${sp.accent}14` : "rgba(255,255,255,0.03)",
                border: `0.5px solid ${on ? `${sp.accent}99` : "rgba(255,255,255,0.08)"}`,
                boxShadow: on ? `0 0 14px ${sp.accent}33` : "none",
              }}
            >
              <span className="text-lg leading-none mb-1">{sp.glyph}</span>
              <span className="font-heading font-bold text-[10px]" style={{ color: on ? sp.accent : "#cfcfcf" }}>{sp.label}</span>
              <span className="font-mono text-[7px] tracking-widest mt-1" style={{ color: on ? sp.accent : "#5a5a5a" }}>
                {isBusy ? "…" : justSubscribed ? "✓ ON" : on ? "ALERTS ON" : "OFF"}
              </span>
              <span className="absolute top-1.5 right-1.5">
                {isBusy ? <Loader2 size={10} className="animate-spin" style={{ color: sp.accent }} /> : on ? <Bell size={10} style={{ color: sp.accent }} /> : <BellOff size={10} style={{ color: "#5a5a5a" }} />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Phone (optional SMS) */}
      <div className="flex items-center gap-2">
        <Phone size={13} style={{ color: "#8a8a8a" }} className="flex-shrink-0" />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={savePhone}
          placeholder="Phone for SMS alerts (optional)"
          type="tel"
          className="flex-1 px-3 py-2 text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", color: "#F5F5F7", borderRadius: 5 }}
        />
        {user && subs.length > 0 && (
          <span className="flex items-center gap-1 font-mono text-[8px] tracking-widest whitespace-nowrap" style={{ color: LIME }}>
            <Check size={11} /> {subs.length} ACTIVE
          </span>
        )}
      </div>

      {!user && !loading && (
        <p className="font-mono text-[9px] tracking-wider mt-3 text-center" style={{ color: "#8a8a8a" }}>
          ▸ LOGIN OR REGISTER TO SAVE YOUR ALERTS
        </p>
      )}
    </div>
  );
}