import React, { useState, useEffect } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { safeSocialUrl } from "@/lib/safeSocialUrl";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, Phone, ExternalLink, Mic, Users, Calendar, ChevronRight, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { dialServices } from "@/data/dialServices";
import SaveServiceButton from "@/components/shared/SaveServiceButton";

export default function HostProfile() {
  const { id } = useParams();
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      try {
        const data = await base44.entities.VoiceHost.get(id);
        setHost(data);
      } catch (err) {
        setError(err.message || "Host not found");
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <div className="w-8 h-8 border-2 border-[rgba(209,255,38,0.2)] border-t-[#D1FF26] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !host) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <div className="text-center">
          <p className="font-mono text-sm tracking-widest mb-2" style={{ color: "#8A8F98" }}>HOST NOT FOUND</p>
          <Link to="/directory" className="font-mono text-xs tracking-widest" style={{ color: "#D1FF26" }}>← Back to Directory</Link>
        </div>
      </div>
    );
  }

  // Map hosted service IDs to full service objects
  const hostedServices = (host.hosted_service_ids || [])
    .map((sid) => dialServices.find((s) => s.id === sid))
    .filter(Boolean);

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.04) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 py-12 lg:py-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase">
          <Link to="/directory" className="flex items-center gap-1.5 transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
            <ArrowLeft size={14} /> Directory
          </Link>
          <ChevronRight size={12} style={{ color: "rgba(138,143,152,0.4)" }} />
          <span style={{ color: "#D1FF26" }}>Host Profile</span>
        </div>

        {/* Hero header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Headshot */}
            <div className="flex-shrink-0 relative">
              <div
                className="w-32 h-32 sm:w-40 sm:h-40 overflow-hidden"
                style={{ border: "1px solid rgba(209,255,38,0.3)", boxShadow: "0 0 30px rgba(209,255,38,0.08)" }}
              >
                {host.headshot_url ? (
                  <img src={proxyMediaUrl(host.headshot_url)} alt={host.host_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(209,255,38,0.06)" }}>
                    <Mic size={40} style={{ color: "rgba(209,255,38,0.3)" }} />
                  </div>
                )}
              </div>
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 pointer-events-none" style={{ borderTop: "1.5px solid rgba(209,255,38,0.5)", borderLeft: "1.5px solid rgba(209,255,38,0.5)" }} />
              <div className="absolute top-0 right-0 w-4 h-4 pointer-events-none" style={{ borderTop: "1.5px solid rgba(209,255,38,0.5)", borderRight: "1.5px solid rgba(209,255,38,0.5)" }} />
              <div className="absolute bottom-0 left-0 w-4 h-4 pointer-events-none" style={{ borderBottom: "1.5px solid rgba(209,255,38,0.5)", borderLeft: "1.5px solid rgba(209,255,38,0.5)" }} />
              <div className="absolute bottom-0 right-0 w-4 h-4 pointer-events-none" style={{ borderBottom: "1.5px solid rgba(209,255,38,0.5)", borderRight: "1.5px solid rgba(209,255,38,0.5)" }} />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[9px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{host.category}</span>
                {host.verified && (
                  <span className="flex items-center gap-1 font-mono text-[9px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.3)" }}>
                    <BadgeCheck size={10} /> VERIFIED HOST
                  </span>
                )}
              </div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>{host.host_name}</h1>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-3 mb-5">
                {host.years_active != null && (
                  <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                    <Calendar size={12} style={{ color: "#D1FF26" }} />
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{host.years_active} YRS ACTIVE</span>
                  </div>
                )}
                {host.total_listeners_reached > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                    <Users size={12} style={{ color: "#D1FF26" }} />
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{host.total_listeners_reached.toLocaleString()} REACHED</span>
                  </div>
                )}
                {hostedServices.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                    <Radio size={12} style={{ color: "#D1FF26" }} />
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{hostedServices.length} SERVICES</span>
                  </div>
                )}
              </div>

              {/* Social links */}
              {host.social_links && host.social_links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {host.social_links.map((link, i) => {
                    const safeHref = safeSocialUrl(link);
                    if (!safeHref) return null;
                    return (
                      <a key={i} href={safeHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.15)]" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                        <ExternalLink size={10} style={{ color: "#D1FF26" }} />
                        <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>{new URL(safeHref).hostname.replace("www.", "")}</span>
                      </a>
                    );
                  })}
                </div>
              )}
              <div className="mt-4">
                <SaveServiceButton
                  serviceName={host.host_name}
                  serviceType="host_profile"
                  referenceId={host.id}
                  linkUrl={`/host/${host.id}`}
                  description={host.bio ? host.bio.slice(0, 200) : `${host.category} host`}
                  iconEmoji="👤"
                  category={host.category}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bio */}
        {host.bio && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mb-10 p-6" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
            <p className="font-mono text-[9px] tracking-widest mb-4" style={{ color: "#D1FF26" }}>▸ ABOUT THE HOST</p>
            <p className="text-base leading-relaxed" style={{ color: "#F5F5F7" }}>{host.bio}</p>
          </motion.div>
        )}

        {/* Hosted shows / services */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
          <p className="font-mono text-[9px] tracking-widest mb-4" style={{ color: "#D1FF26" }}>▸ HOSTED SERVICES</p>

          {hostedServices.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {hostedServices.map((service) => (
                <Link
                  key={service.id}
                  to={`/directory/${service.id}`}
                  className="group flex items-center gap-3 p-4 transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.1)]"
                  style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}
                >
                  <div className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                    <span className="text-2xl">{service.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm truncate" style={{ color: "#F5F5F7" }}>{service.name}</p>
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{service.dial} · {service.category}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: "rgba(209,255,38,0.4)" }} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          ) : host.hosted_shows && host.hosted_shows.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {host.hosted_shows.map((show, i) => (
                <div key={i} className="flex items-center gap-3 p-4" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                  <Radio size={16} style={{ color: "#D1FF26" }} />
                  <p className="font-heading font-semibold text-sm" style={{ color: "#F5F5F7" }}>{show}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>NO SERVICES LINKED YET</p>
            </div>
          )}
        </motion.div>

        {/* Contact */}
        {host.phone && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-8 flex items-center justify-between p-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <div className="flex items-center gap-2">
              <Phone size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#F5F5F7" }}>Contact this host</p>
            </div>
            <a href={`tel:${host.phone}`} className="flex items-center gap-1.5 px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
              Call <ChevronRight size={11} />
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}