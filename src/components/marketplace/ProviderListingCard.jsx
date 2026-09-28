import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star, Phone, MapPin, Clock, BadgeCheck, PhoneCall, ShieldCheck } from "lucide-react";
import CallbackRequestModal from "@/components/marketplace/CallbackRequestModal";

const CATEGORY_ICONS = {
  construction: "🏗️", plumbing: "🔧", electrical: "⚡", hvac: "❄️",
  roofing: "🏠", landscaping: "🌿", automotive: "🚗", cleaning: "🧹",
  legal: "⚖️", medical: "🏥", it: "💻", real_estate: "🏢", other: "📋",
};

export default function ProviderListingCard({ listing }) {
  const [showCallback, setShowCallback] = useState(false);
  const icon = CATEGORY_ICONS[listing.service_category] || "📋";
  const rating = listing.rating || 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-5 transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.1)]"
        style={{ background: "rgba(16,20,29,0.5)", border: `0.5px solid ${listing.verified ? "rgba(209,255,38,0.4)" : "rgba(209,255,38,0.15)"}` }}
      >
        {listing.verified && (
          <div className="absolute top-0 right-0 flex items-center gap-1 px-2 py-1" style={{ background: "rgba(209,255,38,0.15)", borderBottomLeftRadius: "4px" }}>
            <ShieldCheck size={10} style={{ color: "#D1FF26" }} />
            <span className="font-mono text-[7px] tracking-widest" style={{ color: "#D1FF26" }}>BACKGROUND CHECKED</span>
          </div>
        )}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center text-lg" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{listing.provider_name}</p>
                {listing.verified && (
                  <span className="flex items-center gap-0.5 font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.15)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.4)" }}>
                    <BadgeCheck size={9} /> VERIFIED
                  </span>
                )}
              </div>
              <p className="font-mono text-[8px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>{listing.service_category.replace(/_/g, " ")}</p>
            </div>
          </div>
          {rating > 0 && (
            <div className="flex items-center gap-1">
              <Star size={10} style={{ color: "#D1FF26", fill: "#D1FF26" }} />
              <span className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>{rating.toFixed(1)}</span>
              <span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>({listing.review_count || 0})</span>
            </div>
          )}
        </div>

        {listing.description && <p className="text-xs mb-3" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{listing.description}</p>}

        {listing.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {listing.specialties.slice(0, 4).map((s, i) => (
              <span key={i} className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#D1FF26" }}>{s.replace(/_/g, " ").toUpperCase()}</span>
            ))}
          </div>
        )}

        <div className="space-y-1.5 mb-4">
          {listing.availability_text && (
            <div className="flex items-center gap-1.5"><Clock size={9} style={{ color: "#8A8F98" }} /><span className="text-xs" style={{ color: "#8A8F98" }}>{listing.availability_text}</span></div>
          )}
          <div className="flex items-center gap-1.5"><MapPin size={9} style={{ color: "#8A8F98" }} /><span className="text-xs" style={{ color: "#8A8F98" }}>{listing.city}, {listing.state}</span></div>
          {listing.dial_code && (
            <div className="flex items-center gap-1.5"><Phone size={9} style={{ color: "#D1FF26" }} /><span className="font-mono text-xs" style={{ color: "#D1FF26" }}>{listing.dial_code}</span></div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setShowCallback(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]" style={{ background: "#D1FF26", color: "#05070A" }}>
            <PhoneCall size={11} /> Request Callback
          </button>
          {listing.phone && (
            <a href={`tel:${listing.phone}`} className="flex items-center justify-center w-10 py-2.5 transition-all" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
              <Phone size={11} />
            </a>
          )}
        </div>
      </motion.div>

      <CallbackRequestModal open={showCallback} onClose={() => setShowCallback(false)} listing={listing} />
    </>
  );
}