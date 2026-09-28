import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Radio, Check, X, Layers } from "lucide-react";

const NETWORKS = [
  {
    id: "radio",
    name: "Radio Phone Network",
    icon: Radio,
    dial: "*535#",
    standalonePrice: "$4.99/mo",
    desc: "50+ live radio stations across every genre, streaming 24/7.",
    services: [
      "50+ live radio stations",
      "Genre channels — Hip-Hop, Jazz, Afrobeats, Rock, Country, Electronic",
      "Live DJ sets & talk shows",
      "Song request via voice command",
      "Station favorites & quick-tune presets",
      "Artist submission portal for indie creators",
    ],
  },
];

const TIER_ACCESS = {
  radio:    { free: false,        plus: true,         elite: true,  ultimate: true },
};

const TIERS = [
  { id: "free", label: "Free", price: "$0" },
  { id: "plus", label: "Plus", price: "$14.99" },
  { id: "elite", label: "Elite", price: "$49.99" },
  { id: "ultimate", label: "Ultimate", price: "$99" },
];

function AccessCell({ value }) {
  if (value === true) return <Check size={13} style={{ color: "#D1FF26" }} />;
  if (value === false) return <X size={13} style={{ color: "rgba(138,143,152,0.3)" }} />;
  return <span className="font-mono text-[9px] font-semibold" style={{ color: value === "Full" ? "#D1FF26" : "#F5F5F7" }}>{value}</span>;
}

export default function CompareAllTiers() {
  const [inView, setInView] = useState(false);
  const [expandedNetwork, setExpandedNetwork] = useState("radio");
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setInView(true), { threshold: 0.08 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="mb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={12} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// COMPARE ALL TIERS</p>
        </div>
        <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
          What's in the <span style={{ color: "#D1FF26" }}>Radio Phone Network?</span>
        </h2>
        <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
          See exactly which services are included in the Radio Phone Network — and which tier unlocks it.
        </p>
      </motion.div>

      {/* Tier access matrix */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }} className="mb-6 overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 560 }}>
          <thead>
            <tr>
              <th className="text-left p-3 font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98", borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}>NETWORK</th>
              {TIERS.map((t) => (
                <th key={t.id} className="text-center p-3 font-mono text-[9px] tracking-widest" style={{ color: t.id === "elite" || t.id === "ultimate" ? "#D1FF26" : "#8A8F98", borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}>
                  <div>{t.label.toUpperCase()}</div>
                  <div className="font-mono text-[8px] mt-0.5" style={{ color: "#8A8F98" }}>{t.price}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NETWORKS.map((net) => {
              const Icon = net.icon;
              const isExpanded = expandedNetwork === net.id;
              return (
                <tr key={net.id} style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
                  <td className="p-3">
                    <button
                      onClick={() => setExpandedNetwork(isExpanded ? null : net.id)}
                      className="flex items-center gap-2 text-left transition-colors hover:text-[#D1FF26]"
                    >
                      <div className="flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28, background: isExpanded ? "rgba(209,255,38,0.12)" : "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                        <Icon size={13} style={{ color: "#D1FF26" }} />
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-xs" style={{ color: isExpanded ? "#D1FF26" : "#F5F5F7" }}>{net.name}</p>
                        <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>Dial {net.dial} · {net.standalonePrice}</p>
                      </div>
                    </button>
                  </td>
                  {TIERS.map((t) => (
                    <td key={t.id} className="text-center p-3">
                      <AccessCell value={TIER_ACCESS[net.id][t.id]} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Expanded network services list */}
      <motion.div initial={{ opacity: 0, height: 0 }} animate={inView ? { opacity: 1, height: "auto" } : {}} transition={{ duration: 0.4, delay: 0.15 }}>
        {NETWORKS.filter((n) => n.id === expandedNetwork).map((net) => {
          const Icon = net.icon;
          return (
            <motion.div
              key={net.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-5"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center" style={{ width: 36, height: 36, background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                  <Icon size={16} style={{ color: "#D1FF26" }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-heading font-bold text-sm" style={{ color: "#D1FF26" }}>{net.name}</h4>
                  <p className="text-xs" style={{ color: "#8A8F98" }}>{net.desc}</p>
                </div>
                <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26" }}>
                  {net.services.length} SERVICES
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {net.services.map((svc, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className="flex items-start gap-2 p-2"
                    style={{ background: "rgba(209,255,38,0.03)" }}
                  >
                    <Check size={11} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
                    <span className="text-[11px]" style={{ color: "#F5F5F7", lineHeight: 1.4 }}>{svc}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}