import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Grid3x3, LayoutGrid, LayoutDashboard, Menu, X, Search } from "lucide-react";
import { navGroups, scrollToAnchor } from "@/components/landing/navSections";
import { dialServices } from "@/data/dialServices";

const TABS = [
  { label: "Home", icon: Home, anchor: "#top" },
  { label: "Directory", icon: Grid3x3, route: "/directory" },
  { label: "Services", icon: LayoutGrid, anchor: "#services-tabs" },
  { label: "Creators", icon: LayoutDashboard, route: "/creator-dashboard" },
  { label: "More", icon: Menu, action: "more" },
];

export default function MobileTabBar() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleTab = (tab) => {
    if (tab.action === "more") {
      setMoreOpen(true);
      return;
    }
    if (tab.route) {
      navigate(tab.route);
    } else if (tab.anchor) {
      scrollToAnchor(tab.anchor, { navigate, pathname: location.pathname });
    }
  };

  const handleNav = (item) => {
    setMoreOpen(false);
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
          s.tags.some((t) => t.toLowerCase().includes(q))
      )
    : [];
  const filteredNavItems = q
    ? navGroups.flatMap((g) => g.items).filter((i) => i.label.toLowerCase().includes(q))
    : [];

  const isActive = (tab) => {
    if (tab.route) return location.pathname === tab.route;
    return false;
  };

  return (
    <>
      <motion.nav
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="fixed bottom-0 left-0 right-0 z-[55] lg:hidden"
        style={{
          background: "rgba(5,7,10,0.96)",
          borderTop: "0.5px solid rgba(209,255,38,0.2)",
          backdropFilter: "blur(12px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
          <div
            className="h-full w-1/4"
            style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 4s linear infinite" }}
          />
        </div>
        <div className="flex items-stretch justify-around px-0.5 py-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab);
            const isMore = tab.action === "more";
            return (
              <button
                key={tab.label}
                onClick={() => handleTab(tab)}
                className="flex flex-col items-center justify-center gap-1 py-1 px-1 flex-1 min-w-0 transition-all"
                aria-label={tab.label}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center transition-all"
                  style={{
                    background: active ? "rgba(209,255,38,0.12)" : "transparent",
                    border: `0.5px solid ${active ? "rgba(209,255,38,0.4)" : "transparent"}`,
                    boxShadow: active ? "0 0 10px rgba(209,255,38,0.15)" : "none",
                  }}
                >
                  <Icon size={18} style={{ color: active ? "#D1FF26" : isMore ? "#D1FF26" : "#8A8F98" }} />
                </div>
                <span
                  className="font-mono text-[10px] tracking-[0.05em] max-w-full truncate"
                  style={{ color: active ? "#D1FF26" : isMore ? "#D1FF26" : "#8A8F98" }}
                >
                  {tab.label.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </motion.nav>

      {/* "More" sheet — full grouped navigation */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[64] lg:hidden"
              style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed bottom-0 left-0 right-0 z-[66] lg:hidden max-h-[78vh] flex flex-col"
              style={{
                background: "rgba(10,13,20,0.98)",
                borderTop: "0.5px solid rgba(209,255,38,0.25)",
                boxShadow: "0 -12px 50px rgba(0,0,0,0.7)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.12)" }}>
                <div className="flex items-center gap-2">
                  <Menu size={13} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>
                    // NAVIGATION
                  </p>
                </div>
                <button onClick={() => setMoreOpen(false)} className="p-1.5">
                  <X size={16} style={{ color: "#8A8F98" }} />
                </button>
              </div>

              {/* Search */}
              <div className="px-4 py-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8F98" }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search services or pages…"
                    className="w-full pl-9 pr-8 py-2.5 bg-transparent font-mono outline-none"
                    style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7", fontSize: "16px" }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X size={12} style={{ color: "#8A8F98" }} />
                    </button>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
                {q ? (
                  <div className="space-y-1.5">
                    {filteredServices.length === 0 && filteredNavItems.length === 0 && (
                      <p className="font-mono text-[10px] text-center py-6" style={{ color: "#8A8F98" }}>
                        No results for "{searchQuery}"
                      </p>
                    )}
                    {filteredServices.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { navigate(`/directory/${s.id}`); setMoreOpen(false); setSearchQuery(""); }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[rgba(209,255,38,0.06)]"
                        style={{ border: "0.5px solid rgba(138,143,152,0.1)", background: "rgba(5,7,10,0.4)" }}
                      >
                        <span className="text-base flex-shrink-0">{s.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{s.name}</p>
                          <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>{s.category}</p>
                        </div>
                      </button>
                    ))}
                    {filteredNavItems.map((item, idx) => (
                      <button
                        key={item.label + idx}
                        onClick={() => handleNav(item)}
                        className="w-full flex items-center px-3 py-3 text-left transition-colors hover:bg-[rgba(209,255,38,0.06)]"
                        style={{ border: "0.5px solid rgba(138,143,152,0.1)", background: "rgba(5,7,10,0.4)" }}
                      >
                        <span className="font-heading font-semibold text-sm" style={{ color: "#F5F5F7" }}>{item.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {navGroups.map((group) => (
                      <div key={group.label}>
                        <p className="font-mono text-[11px] tracking-[0.2em] uppercase mb-2 px-1" style={{ color: "#D1FF26" }}>
                          {group.label}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {group.items.map((item, idx) => (
                            <button
                              key={item.label + idx}
                              onClick={() => handleNav(item)}
                              className="flex items-center px-3 py-2.5 text-left transition-colors hover:bg-[rgba(209,255,38,0.06)] min-w-0"
                              style={{ border: "0.5px solid rgba(138,143,152,0.1)", background: "rgba(5,7,10,0.4)" }}
                            >
                              <span className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}