import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Building2, Globe2, Landmark, Cloud, Radio, Smartphone, Server, Shield, Zap, Layers, ArrowDown, CheckCircle2, Wifi } from "lucide-react";
import MicroPlugVisualization from "@/components/landing/MicroPlugVisualization";
import DeploymentTimeline from "@/components/landing/DeploymentTimeline";

const audiences = [
  {
    id: "companies",
    icon: Building2,
    label: "Companies",
    title: "For Companies",
    desc: "Deliver app experiences with less cellular dependence and lower data costs. AppNet lets your app data live closer to your customers through Micro-Plugs hosted in partner businesses.",
    points: [
      "Reduce last-mile data costs for high-frequency app updates",
      "Keep apps responsive during network congestion or outages",
      "Turn retail partners into neighborhood data anchors",
      "Maintain full cloud control over ingestion and verification",
    ],
    accent: "#D1FF26",
  },
  {
    id: "countries",
    id: "countries",
    icon: Globe2,
    label: "Countries",
    title: "For Countries",
    desc: "Build resilient digital infrastructure that reaches underserved and rural populations without relying solely on expensive tower buildouts. AppNet extends connectivity through existing local businesses.",
    points: [
      "Bridge connectivity gaps in low-coverage regions",
      "Reduce national bandwidth strain during peak demand",
      "Empower local businesses as network participants",
      "Provide critical app access during disaster or congestion",
    ],
    accent: "#D1FF26",
  },
  {
    id: "nation-states",
    id: "nation-states",
    icon: Landmark,
    label: "Nation States",
    title: "For Nation States",
    desc: "Establish a sovereign-capable application layer that maintains continuity even when international links are degraded. The cloud intelligence stays yours — the delivery becomes local.",
    points: [
      "Sovereign data ingestion and verification pipeline",
      "Neighborhood-scale resilience against external disruption",
      "Community-powered distribution through trusted edge points",
      "Compressed update delivery minimizes external bandwidth needs",
    ],
    accent: "#D1FF26",
  },
];

const flowSteps = [
  { icon: Cloud, label: "Cloud Ingestion", desc: "Approved public or shared data is ingested, verified, and secured in the cloud." },
  { icon: Layers, label: "Compression", desc: "Heavy data is compressed into small update packets optimized for local delivery." },
  { icon: Radio, label: "Micro-Plug Distribution", desc: "Trusted local businesses host Micro-Plug devices that receive and store update packets." },
  { icon: Smartphone, label: "Local Device Access", desc: "Nearby devices fetch relevant app data from the Micro-Plug instead of distant servers." },
  { icon: Wifi, label: "Peer-to-Peer Relay", desc: "AppNet-enabled phones extend the network by passing lightweight updates short distances." },
];

const principles = [
  { icon: Shield, title: "Cloud-Controlled Security", desc: "Ingestion, verification, and synchronization stay in the cloud. Only delivery moves local." },
  { icon: Zap, title: "Efficient Last Mile", desc: "Compressed packets and local caching reduce wasted mobile data at the edge." },
  { icon: Server, title: "Resilient by Design", desc: "Apps keep working during tower congestion, outages, or degraded international links." },
];

export default function AppNetSection() {
  const [inView, setInView] = useState(true);
  const [activeFlow, setActiveFlow] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setActiveFlow((prev) => (prev + 1) % flowSteps.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <section
      ref={sectionRef}
      id="appnet"
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(209,255,38,0.05) 0%, transparent 60%)" }} />

      {/* Decorative node grid */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        {Array.from({ length: 6 }, (_, row) =>
          Array.from({ length: 12 }, (_, col) => (
            <div
              key={`${row}-${col}`}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${(col + 1) * (100 / 13)}%`,
                top: `${15 + row * 12}%`,
                background: (row + col) % 3 === 0 ? "#D1FF26" : "#8A8F98",
                opacity: 0.15 + ((row * 7 + col * 3) % 5) * 0.08,
              }}
            />
          ))
        )}
      </div>

      <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-10 lg:mb-14 text-center">
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: "#D1FF26" }}>// APPNET TECHNOLOGY</p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Cloud Intelligence Meets <span style={{ color: "#D1FF26" }}>Neighborhood Infrastructure</span>
          </h2>
          <p className="text-lg font-light max-w-3xl mx-auto" style={{ color: "#8A8F98", lineHeight: "1.6" }}>
            AppNet is a local-first application network that reduces dependence on centralized mobile-data infrastructure by moving lightweight app data closer to the people who need it. It doesn't replace the internet — it makes it more efficient at the last mile.
          </p>
        </motion.div>

        {/* Data Flow Diagram */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.1 }} className="mb-16">
          <div className="p-6 lg:p-10" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
            <div className="flex items-center gap-2 mb-8">
              <Radio size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// DATA FLOW: CLOUD → MICRO-PLUG → DEVICE</p>
            </div>

            {/* Flow steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-2">
              {flowSteps.map((step, i) => {
                const Icon = step.icon;
                const isActive = activeFlow === i;
                return (
                  <div key={i} className="relative">
                    <motion.div
                      animate={{
                        borderColor: isActive ? "rgba(209,255,38,0.6)" : "rgba(138,143,152,0.15)",
                        background: isActive ? "rgba(209,255,38,0.08)" : "rgba(16,20,29,0.4)",
                      }}
                      transition={{ duration: 0.4 }}
                      className="p-5 h-full"
                      style={{ border: "0.5px solid rgba(138,143,152,0.15)" }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Icon size={16} style={{ color: isActive ? "#D1FF26" : "#8A8F98", transition: "color 0.4s" }} />
                        <span className="font-mono text-[8px] tracking-widest" style={{ color: isActive ? "#D1FF26" : "#8A8F98", transition: "color 0.4s" }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="font-heading font-bold text-sm mb-2" style={{ color: isActive ? "#D1FF26" : "#F5F5F7", transition: "color 0.4s" }}>
                        {step.label}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: "#8A8F98", lineHeight: "1.5" }}>
                        {step.desc}
                      </p>
                    </motion.div>
                    {/* Arrow between steps (desktop) */}
                    {i < flowSteps.length - 1 && (
                      <div className="hidden lg:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10 items-center justify-center">
                        <ArrowDown size={12} className="lg:rotate-270" style={{ color: "rgba(209,255,38,0.4)" }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cloud vs Local split */}
            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              <div className="p-4" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Cloud size={14} style={{ color: "#8A8F98" }} />
                  <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>CLOUD LAYER — HEAVY WORK</p>
                </div>
                <p className="text-xs" style={{ color: "#F5F5F7", lineHeight: "1.5" }}>Ingestion, verification, compression, security controls, and synchronization.</p>
              </div>
              <div className="p-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Radio size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>LOCAL LAYER — DELIVERY</p>
                </div>
                <p className="text-xs" style={{ color: "#F5F5F7", lineHeight: "1.5" }}>Micro-Plug caching, device access, and peer-to-peer relay at the neighborhood scale.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Audience cards */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.15 }} className="mb-16">
          <div className="text-center mb-8">
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// BUILT FOR SCALE</p>
            <h3 className="font-heading font-black text-3xl lg:text-4xl tracking-tight mt-2" style={{ color: "#F5F5F7" }}>
              For Companies, Countries & Nation States
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {audiences.map((aud, i) => {
              const Icon = aud.icon;
              return (
                <motion.div
                  key={aud.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="p-6 flex flex-col"
                  style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.12)" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center" style={{ width: 44, height: 44, background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
                      <Icon size={20} style={{ color: "#D1FF26" }} />
                    </div>
                    <div>
                      <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{aud.label.toUpperCase()}</p>
                      <h4 className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{aud.title}</h4>
                    </div>
                  </div>
                  <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: "1.6" }}>{aud.desc}</p>
                  <ul className="space-y-2.5 mt-auto">
                    {aud.points.map((point, pi) => (
                      <li key={pi} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
                        <span className="text-xs" style={{ color: "#F5F5F7", lineHeight: "1.5" }}>{point}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Principles */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.2 }} className="grid sm:grid-cols-3 gap-4 mb-12">
          {principles.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="p-6 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                <div className="flex items-center justify-center mb-3">
                  <Icon size={20} style={{ color: "#D1FF26" }} />
                </div>
                <h4 className="font-heading font-bold text-sm mb-2" style={{ color: "#F5F5F7" }}>{p.title}</h4>
                <p className="text-xs" style={{ color: "#8A8F98", lineHeight: "1.5" }}>{p.desc}</p>
              </div>
            );
          })}
        </motion.div>

        {/* Micro-Plug interactive visualization */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.22 }} className="mb-16">
          <MicroPlugVisualization />
        </motion.div>

        {/* Deployment Roadmap Timeline */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.25 }} className="mb-12">
          <DeploymentTimeline />
        </motion.div>

        {/* Closing statement */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.25 }} className="text-center max-w-3xl mx-auto p-8" style={{ background: "rgba(209,255,38,0.03)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <p className="font-heading font-bold text-xl lg:text-2xl mb-3" style={{ color: "#F5F5F7", lineHeight: "1.4" }}>
            AppNet turns local businesses into active participants in the digital network around them.
          </p>
          <p className="text-sm" style={{ color: "#8A8F98", lineHeight: "1.6" }}>
            A new kind of app infrastructure: less dependent on towers, less wasteful with mobile data, more resilient during congestion — where cloud intelligence meets neighborhood infrastructure.
          </p>
        </motion.div>
      </div>
    </section>
  );
}