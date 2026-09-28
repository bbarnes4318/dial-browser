import React from "react";
import { motion } from "framer-motion";

const SOCIAL_GALLERY = [
  {
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/4cf0730cf_2IMXC9BDXGPYM81K.png",
    label: "Rep the Network",
    tag: "DIAL SOCIAL",
  },
  {
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/fe394e2fd_LKVX8Q0TACSTY8VU.png",
    label: "Live Shows",
    tag: "LIVE EVENTS",
  },
  {
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/89cebb32b_Z5VSVLAEMHP0G0GJ.png",
    label: "Dial Chat",
    tag: "PRIVATE CHAT",
  },
  {
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/2c8e70178_E3TUZQH8V6RLAU1J.png",
    label: "Meet the Crew",
    tag: "COMMUNITY",
  },
  {
    img: "https://media.base44.com/images/public/6a422320311efd575ae6536c/44885a9fb_Gemini_Generated_Image_xz84pxxz84pxxz84.jpg",
    label: "Global Connect",
    tag: "DIAL SOCIAL",
  },
];

export default function SocialGallery() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mb-12"
    >
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-center mb-5" style={{ color: "#00FFFF" }}>
        // THE DIAL SOCIAL COMMUNITY
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SOCIAL_GALLERY.map((g, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group relative overflow-hidden"
            style={{ border: "0.5px solid rgba(0,255,255,0.25)", boxShadow: "0 0 20px rgba(0,255,255,0.06)" }}
          >
            <img
              src={g.img}
              alt={g.label}
              loading="lazy"
              style={{
                width: "100%",
                height: "auto",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.4s ease, filter 0.4s ease",
                filter: "brightness(0.92) saturate(1.05)",
              }}
              className="group-hover:scale-[1.04]"
            />
            {/* Scrim for label legibility */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(180deg, rgba(5,7,10,0.05) 0%, rgba(5,7,10,0.7) 100%)" }}
            />
            {/* Tag badge */}
            <span
              className="absolute top-2 left-2 font-mono text-[8px] font-bold tracking-widest px-2 py-1"
              style={{ background: "rgba(0,255,255,0.14)", color: "#00FFFF", border: "0.5px solid rgba(0,255,255,0.4)" }}
            >
              {g.tag}
            </span>
            {/* Label */}
            <span
              className="absolute bottom-2 left-2 right-2 font-heading font-bold text-sm tracking-tight"
              style={{ color: "#F5F5F7", textShadow: "0 0 14px rgba(204,0,255,0.4)" }}
            >
              {g.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}