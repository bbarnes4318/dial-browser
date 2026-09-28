import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, ExternalLink, ChevronDown, Search, Radio } from "lucide-react";
import { dialServices } from "@/data/dialServices";
import { navGroups, getActiveAnchor } from "@/components/landing/navSections";
import NavLanguageButton from "@/components/landing/NavLanguageButton";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState("#top");
  const [expandedGroup, setExpandedGroup] = useState("Explore");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const goToRadio = () => {
    setOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.querySelector("#radio");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 500);
    } else {
      const el = document.querySelector("#radio");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNav = (item) => {
    setOpen(false);
    setSearchQuery("");

    if (item.route) {
      navigate(item.route);
    } else if (item.anchor) {
      // If not on home page, navigate home first then scroll after render
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const el = document.querySelector(item.anchor);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 400);
      } else {
        setTimeout(() => {
          const el = document.querySelector(item.anchor);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  };

  // Track active section so users always see where they are
  // Throttled via requestAnimationFrame to avoid scroll jank
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

  const activeLabel = navGroups
    .flatMap((g) => g.items)
    .find((s) => s.anchor === activeAnchor)?.label.toUpperCase() || "";

  const q = searchQuery.trim().toLowerCase();
  const filteredServices = q
    ? dialServices.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        s.desc.toLowerCase().includes(q)
      )
    : [];
  const filteredNavItems = q
    ? navGroups.flatMap((g) => g.items).filter((item) =>
        item.label.toLowerCase().includes(q)
      )
    : [];

  return (
    <>
      {/* Hamburger trigger + On Air button — always visible, vertically stacked */}
      <div className="fixed top-28 right-4 sm:top-20 z-[70] flex flex-col gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 hover:shadow-[0_0_24px_rgba(209,255,38,0.35)]"
          style={{
            background: open ? '#D1FF26' : 'rgba(209,255,38,0.12)',
            border: '1px solid rgba(209,255,38,0.5)',
            backdropFilter: 'blur(8px)',
          }}
          aria-label="Toggle navigation"
        >
          {open ? (
            <X size={18} style={{ color: '#05070A' }} />
          ) : (
            <Menu size={18} style={{ color: '#D1FF26' }} />
          )}
        </button>

        {/* On Air radio button — takes users to the radio station */}
        <button
          onClick={goToRadio}
          className="w-11 h-11 flex flex-col items-center justify-center rounded-full transition-all duration-300 hover:shadow-[0_0_24px_rgba(209,255,38,0.35)] group"
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.5)',
            backdropFilter: 'blur(8px)',
          }}
          aria-label="Go to radio station"
        >
          <Radio size={16} style={{ color: '#ef4444' }} className="group-hover:scale-110 transition-transform" />
          <span className="font-mono text-[6px] tracking-widest mt-0.5" style={{ color: '#ef4444' }}>ON AIR</span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[65]"
              style={{ background: 'rgba(5,7,10,0.85)', backdropFilter: 'blur(4px)' }}
              onClick={() => setOpen(false)}
            />

            {/* Slide-down panel */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed top-0 left-0 right-0 z-[68] pt-20 pb-6 px-4"
              style={{
                background: 'rgba(10,13,20,0.98)',
                borderBottom: '0.5px solid rgba(209,255,38,0.25)',
                boxShadow: '0 12px 50px rgba(0,0,0,0.7)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Signal-line accent strip with traveling data packet */}
              <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
                <div
                  className="h-full w-1/4"
                  style={{
                    background: 'linear-gradient(90deg, transparent, #D1FF26, transparent)',
                    animation: 'tickerScroll 3s linear infinite',
                  }}
                />
              </div>

              {/* Header row with live section readout */}
              <div className="flex items-center gap-2 mb-5 px-1">
                <Phone size={12} style={{ color: '#D1FF26' }} />
                <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: '#D1FF26' }}>
                  // NAVIGATION
                </p>
                <div className="flex-1 h-px" style={{ background: 'rgba(209,255,38,0.15)' }} />
                <span className="font-mono text-[8px] tracking-widest whitespace-nowrap" style={{ color: '#8A8F98' }}>
                  ▸ {activeLabel}
                </span>
              </div>

              {/* Search filter */}
              <div className="mb-4 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8A8F98' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search voice services or pages…"
                  className="w-full pl-9 pr-8 py-3 bg-transparent font-mono outline-none"
                  style={{ border: '0.5px solid rgba(209,255,38,0.2)', color: '#F5F5F7', fontSize: '16px' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                    <X size={12} style={{ color: '#8A8F98' }} />
                  </button>
                )}
              </div>

              {/* Search results or grouped dropdown navigation */}
              {q ? (
                <div className="max-h-[55vh] overflow-y-auto overscroll-contain pr-1 space-y-1.5" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {filteredServices.length === 0 && filteredNavItems.length === 0 && (
                    <p className="font-mono text-[10px] text-center py-6" style={{ color: '#8A8F98' }}>
                      No results for "{searchQuery}"
                    </p>
                  )}
                  {filteredServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => { navigate(`/directory/${service.id}`); setOpen(false); setSearchQuery(""); }}
                      className="w-full flex items-center gap-3 px-3 py-3.5 text-left transition-all duration-200 hover:bg-[rgba(209,255,38,0.06)]"
                      style={{ border: '0.5px solid rgba(138,143,152,0.1)', background: 'rgba(5,7,10,0.4)' }}
                    >
                      <span className="text-lg flex-shrink-0">{service.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-xs truncate" style={{ color: '#F5F5F7' }}>{service.name}</p>
                        <p className="font-mono text-[9px] truncate" style={{ color: '#8A8F98' }}>{service.category} · {service.dial}</p>
                      </div>
                      <span className="font-mono text-[8px] flex-shrink-0" style={{ color: '#D1FF26' }}>SVC</span>
                    </button>
                  ))}
                  {filteredNavItems.map((item, idx) => (
                    <button
                      key={item.label + idx}
                      onClick={() => handleNav(item)}
                      className="w-full flex items-center gap-2 px-3 py-3.5 text-left transition-all duration-200 hover:bg-[rgba(209,255,38,0.06)]"
                      style={{ border: '0.5px solid rgba(138,143,152,0.1)', background: 'rgba(5,7,10,0.4)' }}
                    >
                      <span className="font-heading font-semibold text-xs flex-1" style={{ color: '#F5F5F7' }}>{item.label}</span>
                      <span className="font-mono text-[8px] flex-shrink-0" style={{ color: '#8A8F98' }}>PAGE</span>
                    </button>
                  ))}
                </div>
              ) : (
              <div className="max-h-[60vh] overflow-y-auto overscroll-contain pr-1 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
                {navGroups.map((group, gIdx) => {
                  const isExpanded = expandedGroup === group.label;
                  return (
                    <motion.div
                      key={group.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: gIdx * 0.04, duration: 0.2 }}
                    >
                      {/* Group header — click to toggle dropdown */}
                      <button
                        onClick={() => setExpandedGroup(isExpanded ? null : group.label)}
                        className="w-full flex items-center justify-between px-3 py-3.5 transition-all duration-200"
                        style={{
                          background: isExpanded ? 'rgba(209,255,38,0.08)' : 'rgba(16,20,29,0.6)',
                          border: `0.5px solid ${isExpanded ? 'rgba(209,255,38,0.4)' : 'rgba(209,255,38,0.1)'}`,
                        }}
                      >
                        <span className="font-mono text-[10px] tracking-widest uppercase font-bold" style={{ color: isExpanded ? '#D1FF26' : '#F5F5F7' }}>
                          {group.label}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[8px] tracking-widest" style={{ color: '#8A8F98' }}>
                            {group.items.length} ITEMS
                          </span>
                          <ChevronDown
                            size={14}
                            style={{ color: isExpanded ? '#D1FF26' : '#8A8F98', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}
                          />
                        </span>
                      </button>

                      {/* Dropdown items */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              {group.items.map((item, idx) => {
                                const isActive = !item.route && activeAnchor === item.anchor;
                                return (
                                  <button
                                    key={item.label + idx}
                                    onClick={() => handleNav(item)}
                                    className="group relative flex items-center gap-2 px-3 py-3.5 text-left transition-all duration-200"
                                    style={{
                                      background: isActive ? 'rgba(209,255,38,0.08)' : 'rgba(5,7,10,0.4)',
                                      border: `0.5px solid ${isActive ? 'rgba(209,255,38,0.4)' : 'rgba(138,143,152,0.1)'}`,
                                    }}
                                  >
                                    <span className="font-heading font-semibold text-xs flex-1" style={{ color: isActive ? '#D1FF26' : '#F5F5F7' }}>
                                      {item.label}
                                    </span>
                                    {item.route && (
                                      <ExternalLink size={9} style={{ color: 'rgba(209,255,38,0.4)' }} />
                                    )}
                                    {isActive && (
                                      <span
                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ background: '#D1FF26', boxShadow: '0 0 8px #D1FF26' }}
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
              )}

              {/* Language switcher */}
              <NavLanguageButton variant="mobile" />

              {/* Footer signal line */}
              <div className="mt-5 flex items-center gap-2 px-1">
                <div className="flex-1 h-px" style={{ background: 'rgba(209,255,38,0.15)' }} />
                <span className="font-mono text-[8px] tracking-widest" style={{ color: '#8A8F98' }}>
                  DIAL BROWSER™
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(209,255,38,0.15)' }} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}