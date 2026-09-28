import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Loader2, Phone, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { dialServices } from "@/data/dialServices";

// Map a service category string (as stored in VoiceCommand) to a dial service
function findServiceByCategory(category) {
  if (!category) return null;
  const lower = category.toLowerCase();
  return dialServices.find((svc) => {
    if (svc.category.toLowerCase() === lower) return true;
    return (svc.tags || []).some((t) => lower.includes(t) || t.includes(lower));
  });
}

export default function QuickCommandsPanel() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.VoiceCommand.list("-created_date", 200);
        setCommands(data || []);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Aggregate frequency by matched dial service
  const freqMap = new Map();
  commands.forEach((cmd) => {
    const svc = findServiceByCategory(cmd.service_category) || findServiceByCategory(cmd.command_text);
    if (!svc) return;
    freqMap.set(svc.id, (freqMap.get(svc.id) || 0) + 1);
  });

  const top = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, count]) => {
      const svc = dialServices.find((s) => s.id === id);
      return { ...svc, count };
    });

  // Fallback: if no command history, show popular default services
  const display = top.length > 0 ? top : dialServices.slice(0, 4).map((s) => ({ ...s, count: 0 }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Zap size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// QUICK COMMANDS</p>
        <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>
          {top.length > 0 ? "YOUR MOST-DIALED SERVICES" : "POPULAR SERVICES — DIAL TO GET STARTED"}
        </span>
      </div>

      {loading ? (
        <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Loader2 size={20} className="animate-spin mx-auto" style={{ color: "#D1FF26" }} />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {display.map((svc, idx) => (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.2) }}
              className="group p-4 flex flex-col gap-3 transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.1)]"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.15)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                  <span className="text-lg">{svc.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{svc.name}</p>
                  <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>{svc.dial}</p>
                </div>
                {svc.count > 0 && (
                  <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26" }}>
                    {svc.count}×
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#8A8F98" }}>{svc.desc}</p>

              <div className="flex gap-2 mt-auto">
                <a
                  href={`tel:${svc.dial}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_15px_rgba(209,255,38,0.25)]"
                  style={{ background: "#D1FF26", color: "#05070A" }}
                >
                  <Phone size={12} /> Dial Now
                </a>
                <Link
                  to={`/directory/${svc.id}`}
                  className="flex items-center justify-center w-10 transition-all hover:bg-[rgba(209,255,38,0.08)]"
                  style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#8A8F98" }}
                  title="View details"
                >
                  <ArrowRight size={13} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}