import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, AlertTriangle, Check, Loader2, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Recipient picker for the Share My Location flow.
// audience = "friend"  -> mutual follows (SocialFollow) resolved to SocialProfiles
// audience = "emergency" -> EmergencyContact records for the current member
export default function RecipientPicker({ audience, selected, onToggle }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) { setLoading(false); return; }
      setLoading(true); setError("");
      try {
        if (audience === "emergency") {
          const rows = await base44.entities.EmergencyContact.filter({ active: true }, "-created_date", 100).catch(() => []);
          const list = (rows || []).map((c) => ({
            id: c.id,
            name: c.name,
            sub: c.relationship || "Emergency contact",
            phone: c.phone,
            type: "emergency",
          }));
          if (alive) setOptions(list);
        } else {
          // People I follow (outbound) — these are the friends I can share with.
          const follows = await base44.entities.SocialFollow.filter({ follower_profile_id: { $exists: true } }, "-created_date", 200).catch(() => []);
          // Resolve followed profiles to get display name + owner_user_id
          const followedIds = Array.from(new Set((follows || []).map((f) => f.followed_profile_id).filter(Boolean)));
          const profiles = [];
          for (const pid of followedIds.slice(0, 50)) {
            try {
              const p = await base44.entities.SocialProfile.get(pid);
              if (p) profiles.push(p);
            } catch { /* skip missing */ }
          }
          const list = profiles.map((p) => ({
            id: p.id,
            userId: p.owner_user_id,
            name: p.display_name || p.handle,
            sub: `@${p.handle}`,
            avatar: p.avatar_url,
            type: "friend",
          }));
          if (alive) setOptions(list);
        }
      } catch (e) {
        if (alive) setError(e.message || "Could not load contacts");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [audience, user]);

  const isSelected = (id) => selected.some((s) => s.id === id);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {audience === "emergency" ? <AlertTriangle size={13} style={{ color: "#fb923c" }} /> : <Users size={13} style={{ color: "#D1FF26" }} />}
        <p className="font-mono text-[9px] tracking-widest" style={{ color: audience === "emergency" ? "#fb923c" : "#D1FF26" }}>
          // {audience === "emergency" ? "EMERGENCY CONTACTS" : "YOUR FRIENDS"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin" style={{ color: "#8A8F98" }} />
        </div>
      ) : error ? (
        <p className="font-mono text-[10px]" style={{ color: "#ef4444" }}>{error}</p>
      ) : options.length === 0 ? (
        <div className="text-center py-8" style={{ border: "0.5px dashed rgba(138,143,152,0.15)" }}>
          {audience === "emergency" ? (
            <>
              <AlertTriangle size={22} style={{ color: "rgba(251,146,60,0.3)" }} />
              <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>NO EMERGENCY CONTACTS YET</p>
              <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>Add some from your dashboard first.</p>
            </>
          ) : (
            <>
              <UserPlus size={22} style={{ color: "rgba(209,255,38,0.3)" }} />
              <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#8A8F98" }}>NO FRIENDS TO SHARE WITH</p>
              <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>Follow someone on Dial Social first.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {options.map((opt) => {
            const sel = isSelected(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => onToggle(opt)}
                className="flex items-center gap-3 p-2.5 text-left transition-all"
                style={{ background: sel ? "rgba(209,255,38,0.1)" : "rgba(5,7,10,0.6)", border: `0.5px solid ${sel ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.12)"}` }}
              >
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: sel ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.6)", border: `0.5px solid ${sel ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.15)"}` }}>
                  {opt.avatar ? (
                    <img src={opt.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-heading font-bold text-[11px]" style={{ color: sel ? "#D1FF26" : "#8A8F98" }}>{(opt.name || "?").charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-medium text-[12px] truncate" style={{ color: sel ? "#D1FF26" : "#F5F5F7" }}>{opt.name}</p>
                  <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>{opt.sub}</p>
                </div>
                {sel && <Check size={14} style={{ color: "#D1FF26" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}