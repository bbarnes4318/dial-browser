import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Globe2, PhoneCall, Users, TrendingUp } from "lucide-react";
import AdvertiseHero from "@/components/advertise/AdvertiseHero";
import AdvertiseFormats from "@/components/advertise/AdvertiseFormats";
import PricingSlider from "@/components/advertise/PricingSlider";
import AdvertiseVoiceStudio from "@/components/advertise/AdvertiseVoiceStudio";
import AdvertiseOnboardingForm from "@/components/advertise/AdvertiseOnboardingForm";

const LIME = "#A4FF00";
const PURPLE = "#BC00FF";

const STATS = [
  { Icon: Globe2, value: "2 Billion+", label: "Potential customers reachable", color: LIME },
  { Icon: PhoneCall, value: "Any Phone", label: "No app, no Wi-Fi, no data plan needed", color: PURPLE },
  { Icon: Users, value: "23+ Stations", label: "Live radio + voice + SMS inventory", color: LIME },
  { Icon: TrendingUp, value: "Voice-First", label: "Audio ad recall beats display 3:1", color: PURPLE },
];

export default function Advertise() {
  const scrollToForm = () => {
    document.getElementById("advertise-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: "#05070A" }}>
      <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-6">
        <Link to="/" className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#A4FF00]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </div>

      <AdvertiseHero onStart={scrollToForm} />

      {/* Stats bar */}
      <section className="py-10" style={{ background: "#05070A" }}>
        <div className="max-w-6xl mx-auto px-4 lg:px-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map((s, i) => {
            const Icon = s.Icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="p-4 text-center"
                style={{ background: "rgba(16,20,29,0.5)", border: `0.5px solid ${s.color}30` }}
              >
                <Icon size={18} className="mx-auto mb-2" style={{ color: s.color }} />
                <p className="font-heading font-black text-lg sm:text-2xl" style={{ color: "#F5F5F7" }}>{s.value}</p>
                <p className="text-[10px] mt-1" style={{ color: "#8A8F98" }}>{s.label}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <AdvertiseFormats />

      <PricingSlider />

      <AdvertiseVoiceStudio />

      {/* Why advertise */}
      <section className="py-14 lg:py-20" style={{ background: "#05070A" }}>
        <div className="max-w-4xl mx-auto px-4 lg:px-6 text-center">
          <p className="font-mono text-[10px] tracking-[0.4em] mb-3" style={{ color: LIME }}>// WHY DIAL BROWSER</p>
          <h2 className="font-heading font-black text-2xl sm:text-4xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Reach the <span style={{ color: PURPLE }}>unreached.</span>
          </h2>
          <p className="text-sm max-w-2xl mx-auto" style={{ color: "#8A8F98", lineHeight: 1.7 }}>
            Most ad platforms fight for the same smartphone owners with data plans. Dial Browser reaches the billions on the other side — feature phones, rural callers, low-data users, and the digitally excluded — through a single voice call. One platform. Every audience.
          </p>
        </div>
      </section>

      <AdvertiseOnboardingForm />

      {/* Footer CTA */}
      <section className="py-14" style={{ background: "#05070A" }}>
        <div className="max-w-3xl mx-auto px-4 text-center p-8" style={{ background: `linear-gradient(135deg, ${LIME}12, ${PURPLE}12)`, border: `0.5px solid ${LIME}33` }}>
          <h3 className="font-heading font-black text-xl sm:text-3xl mb-3" style={{ color: "#F5F5F7" }}>
            Your audience is <span style={{ color: LIME }}>listening.</span>
          </h3>
          <p className="text-sm mb-5" style={{ color: "#8A8F98" }}>Submit your application and a partnerships specialist will build your campaign with you.</p>
          <button onClick={() => document.getElementById("advertise-form")?.scrollIntoView({ behavior: "smooth" })} className="px-6 py-3 font-mono text-[11px] tracking-widest uppercase transition-all hover:shadow-[0_0_24px_rgba(188,0,255,0.4)]" style={{ background: PURPLE, color: "#F5F5F7" }}>
            Apply Now
          </button>
        </div>
      </section>
    </div>
  );
}