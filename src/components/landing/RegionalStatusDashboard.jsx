import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2, AlertTriangle, Clock, AlertCircle, X } from "lucide-react";
import SignalPulseIcon from "@/components/landing/SignalPulseIcon";

const regionalStatus = [
  { region: "North America", country: "USA", city: "New York", status: "active", signal: "Optimal", uptime: "99.98%", lastCheck: "2 min ago" },
  { region: "North America", country: "USA", city: "Los Angeles", status: "active", signal: "Optimal", uptime: "99.97%", lastCheck: "1 min ago" },
  { region: "North America", country: "Mexico", city: "Mexico City", status: "active", signal: "Active", uptime: "99.90%", lastCheck: "3 min ago" },
  { region: "Europe", country: "UK", city: "London", status: "active", signal: "Optimal", uptime: "99.99%", lastCheck: "1 min ago" },
  { region: "Europe", country: "Egypt", city: "Cairo", status: "maintenance", signal: "Degraded", uptime: "98.45%", lastCheck: "5 min ago", maintenanceNote: "Scheduled upgrade" },
  { region: "Africa", country: "Nigeria", city: "Lagos", status: "active", signal: "Active", uptime: "99.82%", lastCheck: "2 min ago" },
  { region: "Africa", country: "Kenya", city: "Nairobi", status: "active", signal: "Active", uptime: "99.79%", lastCheck: "4 min ago" },
  { region: "Asia", country: "India", city: "Mumbai", status: "active", signal: "Optimal", uptime: "99.95%", lastCheck: "1 min ago" },
  { region: "Asia", country: "Indonesia", city: "Jakarta", status: "maintenance", signal: "Limited", uptime: "97.23%", lastCheck: "8 min ago", maintenanceNote: "Network expansion" },
  { region: "Asia", country: "Japan", city: "Tokyo", status: "active", signal: "Optimal", uptime: "99.99%", lastCheck: "2 min ago" },
  { region: "South America", country: "Brazil", city: "São Paulo", status: "active", signal: "Active", uptime: "99.88%", lastCheck: "3 min ago" },
  { region: "Oceania", country: "Australia", city: "Sydney", status: "active", signal: "Active", uptime: "99.91%", lastCheck: "4 min ago" },
];

const statusIcons = {
  active: CheckCircle2,
  maintenance: AlertTriangle,
};

const statusColors = {
  active: { bg: "rgba(209,255,38,0.08)", border: "rgba(209,255,38,0.3)", text: "#D1FF26", icon: "#D1FF26" },
  maintenance: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", text: "#ef4444", icon: "#ef4444" },
};

const signalColors = {
  Optimal: "#D1FF26",
  Active: "#8A8F98",
  Degraded: "#f59e0b",
  Limited: "#ef4444",
};

export default function RegionalStatusDashboard() {
  const [inView, setInView] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [showOutageForm, setShowOutageForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [outageType, setOutageType] = useState("no_signal");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.2 }
    );
    const section = document.getElementById("regional-status");
    if (section) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const activeCount = regionalStatus.filter(r => r.status === "active").length;
  const maintenanceCount = regionalStatus.filter(r => r.status === "maintenance").length;

  const handleReportOutage = (location) => {
    setSelectedLocation(location);
    setShowOutageForm(true);
    setSubmitted(false);
  };

  const handleSubmitOutage = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate submission - in production this would call an API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setShowOutageForm(false);
      setDescription("");
      setOutageType("no_signal");
    }, 2000);
  };

  return (
    <section
      id="regional-status"
      className="snap-section relative py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(209,255,38,0.03) 0%, transparent 60%)' }} />

      <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-10 lg:mb-14 text-center">
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>// DIAL BROWSER STATUS</p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            Regional Signal <span style={{ color: '#D1FF26' }}>Dashboard</span>
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Real-time availability across all service regions. Green means go, amber means maintenance.
          </p>
        </motion.div>

        {/* Summary Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.15 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="p-5 text-center" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.15)' }}>
            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: '#8A8F98' }}>TOTAL REGIONS</p>
            <p className="font-heading font-black text-3xl" style={{ color: '#F5F5F7' }}>{regionalStatus.length}</p>
          </div>
          <div className="p-5 text-center" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(209,255,38,0.25)' }}>
            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: '#D1FF26' }}>ACTIVE</p>
            <p className="font-heading font-black text-3xl" style={{ color: '#D1FF26' }}>{activeCount}</p>
          </div>
          <div className="p-5 text-center" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(239,68,68,0.25)' }}>
            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: '#ef4444' }}>MAINTENANCE</p>
            <p className="font-heading font-black text-3xl" style={{ color: '#ef4444' }}>{maintenanceCount}</p>
          </div>
          <div className="p-5 text-center" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.15)' }}>
            <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: '#8A8F98' }}>AVG UPTIME</p>
            <p className="font-heading font-black text-3xl" style={{ color: '#F5F5F7' }}>99.7%</p>
          </div>
        </motion.div>

        {/* Region Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regionalStatus.map((location, i) => {
            const colors = statusColors[location.status];
            const signalColor = signalColors[location.signal];
            const isSelected = selectedRegion === i;

            return (
              <motion.div
                key={`${location.city}-${location.country}`}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                onClick={() => setSelectedRegion(isSelected ? null : i)}
                className={`p-5 cursor-pointer transition-all hover:scale-[1.02]`}
                style={{
                  background: isSelected ? 'rgba(209,255,38,0.06)' : 'rgba(16,20,29,0.4)',
                  border: `0.5px solid ${isSelected ? 'rgba(209,255,38,0.4)' : 'rgba(138,143,152,0.15)'}`,
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <SignalPulseIcon level={location.signal} size={16} />
                    <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: colors.text }}>
                      {location.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: signalColor, boxShadow: `0 0 6px ${signalColor}` }} />
                    <span className="font-mono text-[9px]" style={{ color: signalColor }}>{location.signal}</span>
                  </div>
                </div>

                {/* Location */}
                <h3 className="font-heading font-bold text-lg mb-1" style={{ color: '#F5F5F7' }}>{location.city}</h3>
                <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: '#8A8F98' }}>
                  {location.country} · {location.region}
                </p>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5" style={{ color: '#8A8F98' }}>
                      <Activity size={10} /> Uptime
                    </span>
                    <span className="font-mono text-[10px] font-bold" style={{ color: '#F5F5F7' }}>{location.uptime}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5" style={{ color: '#8A8F98' }}>
                      <Clock size={10} /> Last Check
                    </span>
                    <span className="font-mono text-[10px]" style={{ color: '#8A8F98' }}>{location.lastCheck}</span>
                  </div>
                </div>

                {/* Maintenance Note */}
                {location.maintenanceNote && (
                  <div className="mt-3 pt-3" style={{ borderTop: '0.5px solid rgba(239,68,68,0.2)' }}>
                    <p className="font-mono text-[8px]" style={{ color: '#ef4444' }}>
                      ⚠ {location.maintenanceNote}
                    </p>
                  </div>
                )}

                {/* Report Outage Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReportOutage(location);
                  }}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-xs font-mono tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '0.5px solid rgba(239,68,68,0.3)',
                    color: '#ef4444',
                  }}
                >
                  <AlertCircle size={12} /> Report Outage
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8, delay: 0.6 }} className="mt-8 flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#D1FF26', boxShadow: '0 0 6px #D1FF26' }} />
            <span className="font-mono text-[9px]" style={{ color: '#F5F5F7' }}>Optimal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#8A8F98', boxShadow: '0 0 6px #8A8F98' }} />
            <span className="font-mono text-[9px]" style={{ color: '#F5F5F7' }}>Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
            <span className="font-mono text-[9px]" style={{ color: '#F5F5F7' }}>Degraded</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
            <span className="font-mono text-[9px]" style={{ color: '#F5F5F7' }}>Limited</span>
          </div>
        </motion.div>
      </div>

      {/* Report Outage Dialog */}
      <AnimatePresence>
        {showOutageForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={() => setShowOutageForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#10141D', border: '0.5px solid rgba(239,68,68,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5" style={{ borderBottom: '0.5px solid rgba(239,68,68,0.2)' }}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} style={{ color: '#ef4444' }} />
                  <h3 className="font-heading font-bold text-lg" style={{ color: '#F5F5F7' }}>Report Signal Outage</h3>
                </div>
                <button onClick={() => setShowOutageForm(false)} className="p-1 hover:bg-[rgba(239,68,68,0.1)] transition-colors">
                  <X size={18} style={{ color: '#8A8F98' }} />
                </button>
              </div>

              {/* Content */}
              {submitted ? (
                <div className="p-8 text-center">
                  <CheckCircle2 size={48} style={{ color: '#D1FF26', margin: '0 auto 16px' }} />
                  <p className="font-heading font-bold text-xl mb-2" style={{ color: '#F5F5F7' }}>Report Submitted</p>
                  <p className="font-mono text-sm" style={{ color: '#8A8F98' }}>Thank you for helping map connection issues.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitOutage} className="p-5 space-y-4">
                  {/* Location Info */}
                  <div className="p-3" style={{ background: 'rgba(239,68,68,0.06)', border: '0.5px solid rgba(239,68,68,0.2)' }}>
                    <p className="font-heading font-bold text-sm mb-1" style={{ color: '#F5F5F7' }}>{selectedLocation?.city}</p>
                    <p className="font-mono text-[9px]" style={{ color: '#8A8F98' }}>{selectedLocation?.country} · {selectedLocation?.region}</p>
                  </div>

                  {/* Outage Type */}
                  <div>
                    <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: '#8A8F98' }}>ISSUE TYPE</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "no_signal", label: "No Signal" },
                        { value: "weak_signal", label: "Weak Signal" },
                        { value: "intermittent", label: "Intermittent" },
                        { value: "slow_response", label: "Slow Response" },
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setOutageType(type.value)}
                          className="py-2.5 text-xs font-mono tracking-widest uppercase transition-all"
                          style={{
                            background: outageType === type.value ? 'rgba(239,68,68,0.15)' : 'rgba(16,20,29,0.6)',
                            border: `0.5px solid ${outageType === type.value ? 'rgba(239,68,68,0.4)' : 'rgba(138,143,152,0.15)'}`,
                            color: outageType === type.value ? '#ef4444' : '#F5F5F7',
                          }}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block font-mono text-[9px] tracking-widest mb-2" style={{ color: '#8A8F98' }}>DESCRIPTION</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the issue (optional)..."
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm outline-none transition-all resize-none"
                      style={{
                        background: 'rgba(16,20,29,0.6)',
                        border: '0.5px solid rgba(138,143,152,0.15)',
                        color: '#F5F5F7',
                      }}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-50"
                    style={{
                      background: submitting ? 'rgba(138,143,152,0.3)' : 'rgba(239,68,68,0.15)',
                      border: '0.5px solid rgba(239,68,68,0.4)',
                      color: '#ef4444',
                      boxShadow: !submitting ? '0 0 20px rgba(239,68,68,0.2)' : 'none',
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}