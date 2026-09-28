import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, MapPin, Radio, Zap, TrendingDown } from "lucide-react";

const countryPromos = [
  { code: "US", name: "United States", flag: "🇺🇸", rate: "$0.04", promo: "First 100 calls free", zone: "Local", discount: "40% OFF" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", rate: "$0.02", promo: "Unlimited SMS weekends", zone: "Local", discount: "55% OFF" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", rate: "$0.03", promo: "Free radio streaming", zone: "Local", discount: "50% OFF" },
  { code: "IN", name: "India", flag: "🇮🇳", rate: "$0.01", promo: "Voice + SMS bundle", zone: "Local", discount: "65% OFF" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", rate: "$0.02", promo: "Sports desk access", zone: "Local", discount: "60% OFF" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", rate: "$0.05", promo: "Creator tools free trial", zone: "International", discount: "35% OFF" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", rate: "$0.02", promo: "Family plan 3-for-1", zone: "Local", discount: "58% OFF" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", rate: "$0.02", promo: "Mobile money integration", zone: "Local", discount: "52% OFF" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", rate: "$0.03", promo: "Bilingual voice assistant", zone: "Local", discount: "48% OFF" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", rate: "$0.01", promo: "Island network priority", zone: "Local", discount: "62% OFF" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", rate: "$0.03", promo: "Rural connectivity boost", zone: "Local", discount: "45% OFF" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", rate: "$0.01", promo: "Unlimited local calls", zone: "Local", discount: "68% OFF" },
];

const feedMessages = [
  "▸ RATE UPDATE: IN → $0.01/min confirmed",
  "▸ NEW PROMO: NG sports desk live",
  "▸ SIGNAL LOCK: MX gateway nominal",
  "▸ BUNDLE: PH family plan activated",
  "▸ PEAK TRAFFIC: BR +312% call volume",
  "▸ GATEWAY: KE mobile money linked",
  "▸ DISCOUNT: PK 68% OFF applied",
  "▸ ROUTE: US→GB international stable",
  "▸ NODE: ID island network online",
  "▸ PROMO: CO bilingual assistant live",
];

export default function GlobalPromotions() {
  const [location, setLocation] = useState(null);
  const [detecting, setDetecting] = useState(true);
  const [feed, setFeed] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);

  // Detect user location via IP geolocation
  useEffect(() => {
    const detect = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data && data.country_code) {
          setLocation({
            code: data.country_code,
            name: data.country_name,
            city: data.city,
            ip: data.ip,
          });
        } else {
          setLocation({ code: "US", name: "United States", city: "Unknown", ip: "—" });
        }
      } catch {
        setLocation({ code: "US", name: "United States", city: "Unknown", ip: "—" });
      } finally {
        setDetecting(false);
      }
    };
    detect();
  }, []);

  // Live data feed ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setFeed((prev) => {
        const next = feedMessages[Math.floor(Math.random() * feedMessages.length)];
        const item = { id: Date.now() + Math.random(), text: next, time: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true, hour: 'numeric', minute: '2-digit' }) };
        return [item, ...prev].slice(0, 6);
      });
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // Cycle active country highlight
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % countryPromos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const detectedPromo = countryPromos.find((c) => c.code === location?.code);
  const otherPromos = countryPromos.filter((c) => c.code !== location?.code);

  return (
    <section
      id="promotions"
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(209,255,38,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(209,255,38,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="relative z-10 px-6 lg:px-16 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-8 lg:mb-12"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} style={{ color: '#D1FF26' }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: '#D1FF26' }}>
              // GLOBAL PROMOTION FEED
            </p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            Location-Based<br />
            <span style={{ color: '#D1FF26' }}>Rates & Promotions</span>
          </h2>
          <p className="text-lg font-light max-w-2xl" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Special rates and promotions tuned to where you're connecting from. Our network detects your region and unlocks localized pricing in real time.
          </p>
        </motion.div>

        {/* Connection status bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-wrap items-center justify-between gap-3 p-4 mb-6"
          style={{ background: 'rgba(16,20,29,0.8)', border: '0.5px solid rgba(209,255,38,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ background: detecting ? '#8A8F98' : '#D1FF26', boxShadow: detecting ? 'none' : '0 0 8px #D1FF26', animation: detecting ? 'none' : 'dotPulse 1.5s ease-in-out infinite' }} />
            <div className="flex items-center gap-2">
              <MapPin size={13} style={{ color: '#D1FF26' }} />
              {detecting ? (
                <span className="font-mono text-xs tracking-widest" style={{ color: '#8A8F98' }}>DETECTING LOCATION...</span>
              ) : (
                <span className="font-mono text-xs tracking-widest" style={{ color: '#F5F5F7' }}>
                  CONNECTING FROM: <span style={{ color: '#D1FF26' }}>{location?.name?.toUpperCase()}</span>
                  {location?.city && location.city !== "Unknown" && <span style={{ color: '#8A8F98' }}> · {location.city.toUpperCase()}</span>}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Radio size={13} style={{ color: '#D1FF26' }} />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
              NODE: <span style={{ color: '#D1FF26' }}>{location?.code || '—'}</span> · IP: <span style={{ color: '#F5F5F7' }}>{location?.ip || '—'}</span>
            </span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-3">
          {/* Detected location promo — featured */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="lg:col-span-1 p-6 relative overflow-hidden"
            style={{ background: 'rgba(209,255,38,0.06)', border: '1px solid rgba(209,255,38,0.3)' }}
          >
            <div className="absolute top-0 right-0 px-2 py-1" style={{ background: '#D1FF26' }}>
              <span className="font-mono text-[8px] tracking-widest font-bold" style={{ color: '#05070A' }}>YOUR ZONE</span>
            </div>
            {detectedPromo ? (
              <>
                <div className="text-5xl mb-3">{detectedPromo.flag}</div>
                <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: '#8A8F98' }}>DETECTED REGION</p>
                <h3 className="font-heading font-black text-2xl mb-4" style={{ color: '#F5F5F7' }}>{detectedPromo.name}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>RATE</span>
                  <span className="font-heading font-black text-4xl" style={{ color: '#D1FF26' }}>{detectedPromo.rate}</span>
                  <span className="font-mono text-xs" style={{ color: '#8A8F98' }}>/min</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={13} style={{ color: '#D1FF26' }} />
                  <span className="text-sm font-medium" style={{ color: '#F5F5F7' }}>{detectedPromo.promo}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1" style={{ background: 'rgba(209,255,38,0.15)', border: '0.5px solid rgba(209,255,38,0.3)' }}>
                  <TrendingDown size={11} style={{ color: '#D1FF26' }} />
                  <span className="font-mono text-[10px] tracking-widest font-bold" style={{ color: '#D1FF26' }}>{detectedPromo.discount}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <Globe size={32} style={{ color: '#8A8F98' }} className="mb-3" />
                <p className="font-mono text-xs tracking-wider" style={{ color: '#8A8F98' }}>No localized promo for your region yet</p>
                <p className="font-mono text-[10px] mt-1" style={{ color: 'rgba(138,143,152,0.6)' }}>Standard rates apply</p>
              </div>
            )}
          </motion.div>

          {/* Live data feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="lg:col-span-1 p-5"
            style={{ background: 'rgba(16,20,29,0.6)', border: '0.5px solid rgba(209,255,38,0.12)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: '#D1FF26' }}>LIVE FEED</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#D1FF26', animation: 'dotPulse 1.5s ease-in-out infinite' }} />
                <span className="font-mono text-[9px] tracking-widest" style={{ color: '#D1FF26' }}>STREAMING</span>
              </div>
            </div>
            <div className="space-y-1.5 min-h-[260px]">
              <AnimatePresence initial={false}>
                {feed.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -15, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-2 py-1"
                    style={{ borderBottom: '0.5px solid rgba(138,143,152,0.08)' }}
                  >
                    <span className="font-mono text-[8px] tabular-nums" style={{ color: 'rgba(138,143,152,0.5)' }}>{item.time}</span>
                    <span className="font-mono text-[10px] tracking-wider" style={{ color: '#D1FF26' }}>{item.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {feed.length === 0 && (
                <p className="font-mono text-[10px] tracking-wider py-4" style={{ color: 'rgba(138,143,152,0.5)' }}>▸ AWAITING DATA STREAM...</p>
              )}
            </div>
          </motion.div>

          {/* Global rate grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="lg:col-span-1 p-5"
            style={{ background: 'rgba(16,20,29,0.6)', border: '0.5px solid rgba(209,255,38,0.12)' }}
          >
            <p className="font-mono text-[10px] tracking-[0.3em] mb-4" style={{ color: '#D1FF26' }}>GLOBAL RATE INDEX</p>
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {otherPromos.map((c, i) => {
                const isActive = i === activeIdx % otherPromos.length;
                return (
                  <div
                    key={c.code}
                    className="flex items-center justify-between p-2 transition-all duration-300"
                    style={{
                      background: isActive ? 'rgba(209,255,38,0.08)' : 'transparent',
                      border: `0.5px solid ${isActive ? 'rgba(209,255,38,0.25)' : 'rgba(138,143,152,0.08)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.flag}</span>
                      <div>
                        <p className="text-xs font-medium" style={{ color: isActive ? '#D1FF26' : '#F5F5F7' }}>{c.name}</p>
                        <p className="font-mono text-[8px] tracking-wider" style={{ color: '#8A8F98' }}>{c.zone.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs font-bold" style={{ color: isActive ? '#D1FF26' : '#F5F5F7' }}>{c.rate}/min</p>
                      <p className="font-mono text-[8px] tracking-wider" style={{ color: '#D1FF26' }}>{c.discount}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="font-mono text-[9px] tracking-wider mt-4 text-center"
          style={{ color: 'rgba(138,143,152,0.5)' }}
        >
          ▸ RATES UPDATE IN REAL TIME BASED ON DETECTED CONNECTION ORIGIN · PROMOTIONS SUBJECT TO REGIONAL AVAILABILITY
        </motion.p>
      </div>
    </section>
  );
}