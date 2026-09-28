import React from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { motion } from "framer-motion";
import { MapPin, Trash2, ArrowLeftRight, DollarSign, Package, CheckCircle2 } from "lucide-react";

const categoryLabels = {
  realestate: "Real Estate",
  vehicles: "Vehicles",
  electronics: "Electronics",
  jobs: "Jobs",
  services: "Services",
  other: "Other",
};

const fmtMoney = (n) => "$" + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function ListingCard({ listing, onDelete, onCompleteTrade }) {
  const isTrade = listing.listing_type === "trade";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="flex flex-col overflow-hidden group"
      style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.12)" }}
    >
      {/* Photo */}
      <div className="relative h-44 overflow-hidden" style={{ background: "rgba(209,255,38,0.04)" }}>
        {listing.photo_url ? (
          <img src={proxyMediaUrl(listing.photo_url)} alt={listing.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={32} style={{ color: "rgba(209,255,38,0.3)" }} />
          </div>
        )}
        {/* Type badge */}
        <span
          className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 font-mono text-[8px] tracking-widest uppercase"
          style={{ background: isTrade ? "rgba(138,143,152,0.9)" : "#D1FF26", color: isTrade ? "#F5F5F7" : "#05070A" }}
        >
          {isTrade ? <ArrowLeftRight size={9} /> : <DollarSign size={9} />}
          {isTrade ? "Trade" : "Sale"}
        </span>
        {/* Category badge */}
        <span className="absolute top-2 right-2 px-2 py-1 font-mono text-[8px] tracking-widest" style={{ background: "rgba(5,7,10,0.8)", color: "#D1FF26" }}>
          {categoryLabels[listing.category] || "Other"}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-heading font-bold text-base mb-1" style={{ color: "#F5F5F7" }}>{listing.title}</h3>
        {listing.location && (
          <p className="flex items-center gap-1 text-xs mb-2" style={{ color: "#8A8F98" }}>
            <MapPin size={10} /> {listing.location}
          </p>
        )}
        <p className="text-xs mb-3 flex-1" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
          {listing.description}
        </p>

        <div className="flex items-center justify-between">
          {isTrade ? (
            <p className="font-heading font-black text-lg" style={{ color: "#8A8F98" }}>Open to Trade</p>
          ) : (
            <p className="font-heading font-black text-xl" style={{ color: "#D1FF26" }}>
              {fmtMoney(listing.price)}
            </p>
          )}
          <div className="flex items-center gap-1">
            {onCompleteTrade && (
              <button
                onClick={() => onCompleteTrade(listing)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.2)]"
                style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
              >
                <CheckCircle2 size={11} /> Done
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(listing)}
                className="p-2 transition-colors hover:text-rose-400"
                style={{ color: "#8A8F98" }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}