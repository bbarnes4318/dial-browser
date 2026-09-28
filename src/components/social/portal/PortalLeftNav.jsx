import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Compass, MessageSquare, Bell, PlusCircle, User, Users, Settings, Gamepad2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { PORTAL } from "./portalTheme";
import PortalVoiceModule from "./PortalVoiceModule";

const NAV = [
  { id: "home", label: "Home", Icon: Home, to: "/social" },
  { id: "explore", label: "Explore", Icon: Compass, to: "/community-gallery" },
  { id: "messages", label: "Messages", Icon: MessageSquare, to: "/messages", badgeKey: "messages" },
  { id: "notifications", label: "Notifications", Icon: Bell, to: "#notifications", badgeKey: "notifications" },
  { id: "create", label: "Create Post", Icon: PlusCircle, to: "#composer" },
  { id: "profile", label: "Profile", Icon: User, to: null, self: true, highlight: true },
  { id: "friends", label: "Friends", Icon: Users, to: "/social" },
  { id: "groups", label: "Groups", Icon: Gamepad2, to: "/groups" },
  { id: "settings", label: "Settings", Icon: Settings, to: "/account" },
];

export default function PortalLeftNav({ myProfile, active, onVoiceCommand, className }) {
  const [badges, setBadges] = useState({ messages: 0, notifications: 0 });
  const loc = useLocation();

  useEffect(() => {
    if (!myProfile) return;
    let cancelled = false;
    (async () => {
      try {
        const msgs = await base44.entities.SocialMessage.filter({ recipient_profile_id: myProfile.id }, "-created_date", 50);
        if (cancelled) return;
        const unread = msgs.filter((m) => !m.read).length;
        // notifications = recent likes + comments + follows on my posts
        const [likes, comments, follows] = await Promise.all([
          base44.entities.SocialLike.filter({ liker_profile_id: myProfile.id }, "-created_date", 30),
          base44.entities.SocialComment.filter({ author_profile_id: myProfile.id }, "-created_date", 30),
          base44.entities.SocialFollow.filter({ followed_profile_id: myProfile.id }, "-created_date", 30),
        ]);
        if (cancelled) return;
        setBadges({ messages: unread, notifications: (likes?.length || 0) + (comments?.length || 0) + (follows?.length || 0) });
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [myProfile, loc.pathname]);

  return (
    <aside className={`flex flex-col gap-2 ${className || ""}`}>
      {/* Brand */}
      <div className="flex items-center gap-2 px-3 py-3" style={{ background: "rgba(0,240,255,0.05)", border: "0.5px solid rgba(0,240,255,0.2)", borderRadius: 10 }}>
        <span className="flex items-center justify-center w-8 h-8 font-heading font-black text-sm" style={{ background: "linear-gradient(135deg,#00f0ff,#ff00ff)", color: "#050515", borderRadius: 6 }}>DB</span>
        <div className="leading-none">
          <p className="font-heading font-black text-sm" style={{ color: PORTAL.text }}>DIAL BROWSER</p>
          <p className="font-mono text-[7px] tracking-[0.25em] mt-1" style={{ color: PORTAL.cyan }}>ONE NUMBER. EVERY SERVICE.</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2" style={{ background: "rgba(12,12,32,0.5)", border: "0.5px solid rgba(0,240,255,0.14)", borderRadius: 10 }}>
        {NAV.map((item) => {
          const to = item.self ? `/social/profile/${myProfile?.handle || ""}` : item.to;
          const isActive = active === item.id;
          const badge = badges[item.badgeKey] || 0;
          return (
            <Link
              key={item.id}
              to={to}
              className="flex items-center gap-3 px-3 py-2.5 transition-all"
              style={{
                borderRadius: 8,
                background: isActive ? "rgba(0,240,255,0.12)" : item.highlight ? "rgba(255,0,255,0.08)" : "transparent",
                border: isActive ? "0.5px solid rgba(0,240,255,0.4)" : "0.5px solid transparent",
              }}
            >
              <item.Icon size={16} style={{ color: isActive ? PORTAL.cyan : item.highlight ? PORTAL.magenta : "#c0c0c0" }} />
              <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: isActive ? PORTAL.cyan : item.highlight ? "#e0e0e0" : "#b0b0b0" }}>{item.label}</span>
              {badge > 0 && (
                <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 font-mono text-[9px] font-bold" style={{ background: PORTAL.pink, color: "#fff", borderRadius: 9, boxShadow: "0 0 10px rgba(255,0,85,0.5)" }}>{badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <PortalVoiceModule onCommand={onVoiceCommand} />
    </aside>
  );
}