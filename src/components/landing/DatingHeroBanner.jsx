import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowRight } from "lucide-react";

const IMG = "https://media.base44.com/images/public/6a422320311efd575ae6536c/b324c78cb_Gemini_Generated_Image_g5zw1tg5zw1tg5zw.jpg";
const PORTRAIT = "https://media.base44.com/images/public/6a422320311efd575ae6536c/ec6912741_Gemini_Generated_Image_lr8fq9lr8fq9lr8f.jpg";

// Dial Dating hero banner using the supplied key art. Used two ways:
// - variant="landing" (homepage): full image with overlay text + "Enter Dating Portal" CTA beneath the image.
// - variant="header" (dating page): compact header strip, no CTA.
export default function DatingHeroBanner({ variant = "landing" }) {
  const isHeader = variant === "header";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="relative w-full overflow-hidden mb-8"
      style={{ border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 0 40px rgba(209,255,38,0.08)" }}
    >
      <div className="relative w-full">
        {/* Show the entire image at its natural aspect ratio (no cropping) */}
        <img src={IMG} alt="Dial Dating — Connect. Match. Chat." className="block w-full h-auto object-contain" />
      </div>
      {/* Dial Dating text moved below the image instead of overlaying it */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-6" style={{ background: "#05070A", borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
        <p className="font-mono text-[9px] sm:text-[10px] tracking-[0.5em] mb-2" style={{ color: "#D1FF26" }}>// 1 CALL DATING™</p>
        <h2 className="font-heading font-black text-3xl sm:text-5xl tracking-tight mb-2" style={{ background: "linear-gradient(90deg, #D1FF26, #B4E051)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DIAL DATING</h2>
        <p className="font-mono text-[10px] sm:text-xs tracking-[0.3em] mb-2" style={{ color: "#F5F5F7" }}>
          <span style={{ color: "#22d3ee" }}>●</span> CONNECT <span style={{ color: "#FF9F64" }}>●</span> MATCH <span style={{ color: "#22d3ee" }}>●</span> CHAT
        </p>
        <p className="font-mono text-[9px] sm:text-[10px] tracking-[0.25em] mb-1" style={{ color: "#8A8F98" }}>PRIVATE · SECURE · ANONYMOUS</p>
        <p className="font-mono text-[10px] sm:text-xs tracking-widest" style={{ color: "#D1FF26" }}>FIND A PARTNER WITH ZERO DIGITAL FOOTPRINT</p>
      </div>
      {!isHeader && (
        <div className="flex justify-center py-4" style={{ background: "rgba(5,7,10,0.6)", borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
          <Link to="/dating" className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase" style={{ background: "#D1FF26", color: "#05070A" }}>
            <Heart size={12} /> Enter Dating Portal <ArrowRight size={12} />
          </Link>
        </div>
      )}
      {!isHeader && (
        <div className="w-full" style={{ borderTop: "0.5px solid rgba(209,255,38,0.15)" }}>
          <img src={PORTRAIT} alt="1 Call Dating — neon cyberpunk portrait" className="block w-full h-auto object-contain" />
        </div>
      )}
    </motion.div>
  );
}