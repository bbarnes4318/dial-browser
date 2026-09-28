import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass, Search, ChevronLeft, ChevronRight, BookOpen, Users, Radio,
  LayoutDashboard, Store, HelpCircle, Crown, LogIn, UserPlus, X, Heart, Music2,
  Megaphone, Globe,
} from "lucide-react";
import { navGroups, getActiveAnchor, scrollToAnchor } from "@/components/landing/navSections";
import { dialServices } from "@/data/dialServices";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";
import { LOGO_URL } from "@/lib/brandLogo";
import NavLanguageButton from "@/components/landing/NavLanguageButton";
import NotificationsBell from "@/components/NotificationsBell";

const GROUP_ICONS = {
  Explore: Compass,
  "Social & Dating": Heart,
  "Music & Radio": Music2,
  "How It Works": BookOpen,
  Community: Users,
  "Network & Tech": Radio,
  Dashboard: LayoutDashboard,
  "Service Marketplace": Store,
  "Help & Guides": HelpCircle,
  "Business & Ads": Megaphone,
  Premium: Crown,
};

const EXPANDED_W = 256;
const COLLAPSED_W = 68;

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState("#top");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-w",
      `${collapsed ? COLLAPSED_W : EXPANDED_W}px`
    );
  }, [collapsed]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setActiveAnchor(getActiveAnchor());
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (item) => {
    setSearchQuery("");
    if (item.route) {
      navigate(item.route);
    } else if (item.anchor) {
      scrollToAnchor(item.anchor, { navigate, pathname: location.pathname });
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredServices = q
    ? dialServices.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)) ||
          s.desc.toLowerCase().includes(q)
      )
    : [];
  const filteredNavItems = q
    ? navGroups.flatMap((g) => g.items).filter((i) => i.label.toLowerCase().includes(q))
    : [];

  const width = collapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <aside
      className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 flex-col transition-[width] duration-300"
      style={{
        width,
        background: "rgba(5,7,10,0.96)",
        borderRight: "0.5px solid rgba(209,255,38,0.18)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Scanning line accent */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div
          className="h-full w-1/3"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.5), transparent)",
            animation: "tickerScroll 5s linear infinite",
          }}
        />
      </div>

      {/* Logo lockup */}
      <button
        onClick={() => handleNav({ anchor: "#top" })}
        className="flex items-center gap-3 px-3 py-4 transition-colors hover:bg-[rgba(209,255,38,0.05)]"
        style={{ borderBottom: "0.5px solid rgba(209,255,38,0.12)" }}
      >
        <img
          src={LOGO_URL}
          alt="Dial Browser compass dial"
          className="flex-shrink-0"
          style={{ height: 38, width: "auto", maxHeight: 44, filter: "drop-shadow(0 0 10px rgba(209,255,38,0.35))" }}
        />
        {!collapsed && (
          <div className="flex flex-col items-start overflow-hidden">
            <span className="font-heading font-black text-sm leading-none tracking-tight" style={{ color: "#F5F5F7" }}>
              DIAL BROWSER
            </span>
            <span className="font-mono text-[7px] tracking-[0.25em] mt-1" style={{ color: "#D1FF26" }}>
              CALL · CONNECT · BROWSE
            </span>
          </div>
        )}
      </button>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 py-3">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services…"
              className="w-full pl-8 pr-7 py-2 bg-transparent font-mono outline-none text-sm"
              style={{ border: "0.5px solid rgba(209,255,38,0.18)", color: "#F5F5F7", fontSize: "13px" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X size={11} style={{ color: "#8A8F98" }} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Nav body */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
        {q && !collapsed ? (
          <div className="space-y-1 pt-1">
            {filteredServices.length === 0 && filteredNavItems.length === 0 && (
              <p className="font-mono text-[10px] text-center py-4" style={{ color: "#8A8F98" }}>
                No results
              </p>
            )}
            {filteredServices.map((s) => (
              <button
                key={s.id}
                onClick={() => { navigate(`/directory/${s.id}`); setSearchQuery(""); }}
                className="w-full flex items-center gap-2 px-2 py-2 text-left transition-colors hover:bg-[rgba(209,255,38,0.06)]"
              >
                <span className="text-sm flex-shrink-0">{s.icon}</span>
                <span className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{s.name}</span>
              </button>
            ))}
            {filteredNavItems.map((item, idx) => (
              <button
                key={item.label + idx}
                onClick={() => handleNav(item)}
                className="w-full flex items-center px-2 py-2 text-left transition-colors hover:bg-[rgba(209,255,38,0.06)]"
              >
                <span className="font-heading font-semibold text-sm" style={{ color: "#F5F5F7" }}>{item.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {navGroups.map((group) => {
              const Icon = GROUP_ICONS[group.label] || Compass;
              if (collapsed) {
                return (
                  <button
                    key={group.label}
                    onClick={() => setCollapsed(false)}
                    className="w-full flex items-center justify-center py-2.5 transition-colors hover:bg-[rgba(209,255,38,0.06)] group"
                    title={group.label}
                  >
                    <Icon size={16} style={{ color: "#8A8F98" }} className="group-hover:text-[#D1FF26] transition-colors" />
                  </button>
                );
              }
              return (
                <div key={group.label}>
                  <div className="flex items-center gap-1.5 px-2 mb-1">
                    <Icon size={12} style={{ color: "#D1FF26" }} />
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "#D1FF26" }}>
                      {group.label}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item, idx) => {
                      const isActive = !item.route && activeAnchor === item.anchor;
                      return (
                        <button
                          key={item.label + idx}
                          onClick={() => handleNav(item)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-left transition-all duration-200 group"
                          style={{
                            background: isActive ? "rgba(209,255,38,0.08)" : "transparent",
                            borderLeft: isActive ? "2px solid #D1FF26" : "2px solid transparent",
                          }}
                        >
                          <span
                            className="font-heading font-medium text-[13px] truncate flex-1 transition-colors"
                            style={{ color: isActive ? "#D1FF26" : "#8A8F98" }}
                          >
                            {item.label}
                          </span>
                          {isActive && (
                            <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#D1FF26", boxShadow: "0 0 6px #D1FF26" }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {!collapsed && <NavLanguageButton variant="mobile" />}
          </div>
        )}
      </div>

      {/* Footer: auth + lang + collapse */}
      <div style={{ borderTop: "0.5px solid rgba(209,255,38,0.12)" }} className="px-2 py-2">
        {!collapsed ? (
          <div className="space-y-1.5">
            <NotificationsBell variant="sidebar" />
            <button
              onClick={() => openRegistrationModal()}
              className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.3)]"
              style={{ background: "#D1FF26", color: "#05070A" }}
            >
              <UserPlus size={12} /> Register
            </button>
            <button
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors hover:bg-[rgba(209,255,38,0.06)]"
              style={{ border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
            >
              <LogIn size={12} /> Login
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <NotificationsBell variant="sidebar" />
            <button
              onClick={() => openRegistrationModal()}
              className="w-9 h-9 flex items-center justify-center transition-all hover:shadow-[0_0_14px_rgba(209,255,38,0.3)]"
              style={{ background: "#D1FF26", color: "#05070A" }}
              title="Register"
            >
              <UserPlus size={14} />
            </button>
            <NavLanguageButton variant="dock" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-1.5 mt-1 transition-colors hover:bg-[rgba(209,255,38,0.06)]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={13} style={{ color: "#8A8F98" }} /> : <ChevronLeft size={13} style={{ color: "#8A8F98" }} />}
        </button>
      </div>
    </aside>
  );
}