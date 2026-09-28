import React, { useState, useEffect, useMemo } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";
import { ArrowLeft, Phone, Copy, Check, Bookmark, BookmarkCheck, TrendingUp, TrendingDown, Users, Clock, Activity, Zap, ChevronRight, Mic, BadgeCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { dialServices, getServiceStats } from "@/data/dialServices";
import ServiceComparisonTable from "@/components/dial/ServiceComparisonTable";
import SaveServiceButton from "@/components/shared/SaveServiceButton";
import ServiceVoiceDemo from "@/components/dial/ServiceVoiceDemo";
import VoiceGuidedToggle from "@/components/voice/VoiceGuidedToggle";

const BOOKMARK_KEY = "dial_bookmarks";

function StatCard({ icon: Icon, label, value, unit, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="p-5"
      style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{label}</p>
      </div>
      <p className="font-heading font-black text-3xl" style={{ color: "#D1FF26" }}>
        {value}
        {unit && <span className="text-lg ml-1">{unit}</span>}
      </p>
    </motion.div>
  );
}

export default function DialServiceDetail() {
  const { id } = useParams();
  const service = dialServices.find((s) => s.id === id);
  const [bookmarked, setBookmarked] = useState(false);
  const [host, setHost] = useState(null);

  const stats = useMemo(() => service ? getServiceStats(service.id) : null, [service]);

  // Load the voice host associated with this service
  useEffect(() => {
    if (!service) return;
    let cancelled = false;
    const loadHost = async () => {
      try {
        const hosts = await base44.entities.VoiceHost.filter({}, "-created_date", 50);
        if (cancelled) return;
        const matched = (hosts || []).find((h) => h.hosted_service_ids && h.hosted_service_ids.includes(service.id));
        setHost(matched || null);
      } catch { /* no host linked */ }
    };
    loadHost();
    return () => { cancelled = true; };
  }, [service]);

  useEffect(() => {
    if (!service) return;
    try {
      const stored = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]");
      setBookmarked(stored.includes(service.id));
    } catch { /* ignore */ }
  }, [service]);

  // Scroll to top on mount / service change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <div className="text-center">
          <p className="font-mono text-sm tracking-widest mb-2" style={{ color: "#8A8F98" }}>SERVICE NOT FOUND</p>
          <Link to="/directory" className="font-mono text-xs tracking-widest" style={{ color: "#D1FF26" }}>← Back to Directory</Link>
        </div>
      </div>
    );
  }

  const toggleBookmark = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]");
      const updated = stored.includes(service.id)
        ? stored.filter((sid) => sid !== service.id)
        : [...stored, service.id];
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updated));
      setBookmarked(!bookmarked);
    } catch { /* ignore */ }
  };

  // Related services in same category
  const related = dialServices.filter((s) => s.category === service.category && s.id !== service.id).slice(0, 3);

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-16 py-12 lg:py-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase">
          <Link to="/directory" className="flex items-center gap-1.5 transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
            <ArrowLeft size={14} /> Directory
          </Link>
          <ChevronRight size={12} style={{ color: "rgba(138,143,152,0.4)" }} />
          <span style={{ color: "#8A8F98" }}>{service.category}</span>
          <ChevronRight size={12} style={{ color: "rgba(138,143,152,0.4)" }} />
          <span style={{ color: "#D1FF26" }}>{service.name}</span>
        </div>

        {/* Hero header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center" style={{ width: 72, height: 72, background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                <span className="text-4xl">{service.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[9px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{service.category}</span>
                  <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>ID: {service.id}</span>
                </div>
                <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>{service.name}</h1>
                <p className="text-base font-light max-w-xl" style={{ color: "#8A8F98", lineHeight: "1.6" }}>{service.desc}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action bar — dial code, copy, bookmark */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="flex flex-col sm:flex-row gap-3 mb-12">
          {/* How to connect */}
          <div className="flex-1 flex items-center gap-3 p-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
            <Phone size={16} style={{ color: "#D1FF26" }} />
            <div>
              <p className="font-mono text-[9px] tracking-widest mb-0.5" style={{ color: "#8A8F98" }}>HOW TO CONNECT</p>
              <p className="font-heading font-bold text-sm" style={{ color: "#D1FF26" }}>Call the 1 Call Away number and say "{service.name}"</p>
            </div>
          </div>

          {/* Call & speak — see the "How to connect" panel */}

          {/* Bookmark button */}
          <SaveServiceButton
            serviceName={service.name}
            serviceType="dial_service"
            referenceId={service.id}
            dialCode=""
            linkUrl={`/directory/${service.id}`}
            description={service.desc}
            iconEmoji={service.icon}
            category={service.category}
          />


        </motion.div>

        {/* Voice line is live — call the 1 Call Away number and speak to connect */}

        {/* Voice-only guided mode toggle */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mb-10">
          <VoiceGuidedToggle steps={[
            `Voice-only guided mode is on for ${service.name}. ${service.desc}`,
            `Step one. Call the 1 Call Away number from any phone.`,
            `Step two. When the call connects, speak your request in plain language.`,
            `Step three. Listen to the response, delivered in a real human voice.`,
            `Step four. Confirm the details, or ask follow-up questions.`,
            `That is the full process. Press play on the voice demo below to hear an example.`,
          ]} />
        </motion.div>

        {/* Voice demo player */}
        <ServiceVoiceDemo service={service} />

        {/* Host profile card */}
        {host && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Mic size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// YOUR HOST</p>
            </div>
            <Link
              to={`/host/${host.id}`}
              className="group flex items-center gap-4 p-5 transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.1)]"
              style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}
            >
              <div className="w-16 h-16 flex-shrink-0 overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.3)" }}>
                {host.headshot_url ? (
                  <img src={proxyMediaUrl(host.headshot_url)} alt={host.host_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(209,255,38,0.06)" }}>
                    <Mic size={20} style={{ color: "rgba(209,255,38,0.3)" }} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-heading font-bold text-lg truncate" style={{ color: "#F5F5F7" }}>{host.host_name}</p>
                  {host.verified && <BadgeCheck size={14} style={{ color: "#D1FF26" }} />}
                </div>
                <p className="text-sm line-clamp-2" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                  {host.bio ? host.bio.slice(0, 120) + (host.bio.length > 120 ? "…" : "") : `Host of ${service.name}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 flex-shrink-0" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>VIEW PROFILE</span>
                <ChevronRight size={12} style={{ color: "#D1FF26" }} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Usage Statistics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="mb-10">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Activity size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// USAGE STATISTICS — ILLUSTRATIVE SAMPLE</p>
            </div>
            <span className="font-mono text-[9px] tracking-widest px-2 py-1" style={{ background: "rgba(138,143,152,0.1)", color: "#8A8F98" }}>SAMPLE DATA</span>
          </div>
          <p className="font-mono text-[9px] mb-4" style={{ color: "rgba(138,143,152,0.7)" }}>Figures shown are illustrative samples for demonstration, not live platform metrics.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Phone} label="TOTAL CALLS" value={stats.totalCalls.toLocaleString()} delay={0.2} />
            <StatCard icon={Users} label="UNIQUE USERS" value={stats.uniqueUsers.toLocaleString()} delay={0.25} />
            <StatCard icon={Clock} label="AVG DURATION" value={stats.avgDuration} unit="s" delay={0.3} />
            <StatCard icon={Zap} label="SUCCESS RATE" value={stats.successRate} unit="%" delay={0.35} />
          </div>
        </motion.div>

        {/* Recent Popularity — 7-day chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mb-10 p-6" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// ILLUSTRATIVE POPULARITY (SAMPLE)</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: stats.trend === "up" ? "rgba(209,255,38,0.08)" : "rgba(239,68,68,0.08)", border: `0.5px solid ${stats.trend === "up" ? "rgba(209,255,38,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              {stats.trend === "up" ? <TrendingUp size={12} style={{ color: "#D1FF26" }} /> : <TrendingDown size={12} style={{ color: "#ef4444" }} />}
              <span className="font-mono text-[10px] font-bold" style={{ color: stats.trend === "up" ? "#D1FF26" : "#ef4444" }}>
                {stats.trend === "up" ? "+" : "-"}{stats.trendPercent}%
              </span>
            </div>
          </div>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={stats.dailyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: "#8A8F98", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "rgba(138,143,152,0.15)" }} tickLine={false} />
                <Bar dataKey="calls" radius={[2, 2, 0, 0]}>
                  {stats.dailyData.map((entry, i) => (
                    <Cell key={i} fill={i === stats.dailyData.length - 1 ? "#D1FF26" : "rgba(209,255,38,0.4)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Peak hour + example */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }} className="grid sm:grid-cols-2 gap-3 mb-12">
          <div className="p-5" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>PEAK USAGE HOUR</p>
            <p className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>
              {stats.peakHour > 12 ? stats.peakHour - 12 : stats.peakHour}{stats.peakHour >= 12 ? " PM" : " AM"}
            </p>
            <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>Highest call volume window</p>
          </div>
          <div className="p-5" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>USAGE EXAMPLE</p>
            <p className="font-mono text-[11px]" style={{ color: "#F5F5F7" }}>{service.example}</p>
          </div>
        </motion.div>

        {/* Comparison table */}
        <ServiceComparisonTable currentService={service} />

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-12">
          {service.tags.map((tag) => (
            <span key={tag} className="font-mono text-[9px] tracking-widest uppercase px-3 py-1.5" style={{ background: "rgba(138,143,152,0.08)", color: "#8A8F98" }}>#{tag}</span>
          ))}
        </div>

        {/* Related services */}
        {related.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <div className="flex items-center gap-2 mb-5">
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// RELATED IN {service.category.toUpperCase()}</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/directory/${rel.id}`}
                  className="group flex items-center gap-3 p-4 transition-all duration-300 hover:border-[rgba(209,255,38,0.35)]"
                  style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.08)" }}
                >
                  <span className="text-2xl">{rel.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{rel.name}</p>
                    <p className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>Call & ask for {rel.name}</p>
                  </div>
                  <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" style={{ color: "#8A8F98" }} />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}