import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";

// Ultra-highlighted lime phone, fixed on the right edge and vertically
// centered so it never overlaps the top-right Live Signal indicator or the
// bottom-right floating controls. Tapping it routes to the homepage and
// scrolls to the live softphone (#home-dial-phone).
export default function FloatingHomePhoneButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    const waitFor = (sel, ms = 6000) =>
      new Promise((res) => {
        const t0 = Date.now();
        (function check() {
          if (document.querySelector(sel)) return res(true);
          if (Date.now() - t0 > ms) return res(false);
          setTimeout(check, 100);
        })();
      });

    const scrollPhone = async () => {
      // Wait for the homepage to mount before scrolling.
      await waitFor("#top", 6000);
      // The phone lives in a lazy-loaded section, so progressively scroll
      // down until it mounts, then center it.
      for (let i = 0; i < 30; i++) {
        const el = document.getElementById("home-dial-phone");
        if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
        const before = window.scrollY;
        window.scrollBy(0, window.innerHeight);
        await new Promise((r) => setTimeout(r, 200));
        if (window.scrollY === before) break; // reached the bottom
      }
      const el = document.getElementById("home-dial-phone");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    if (location.pathname !== "/") {
      navigate("/");
      scrollPhone();
    } else {
      scrollPhone();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      aria-label="Go to the live Dial Phone on the homepage"
      className="fixed right-4 z-[80] flex items-center justify-center"
      style={{
        top: "50%",
        transform: "translateY(-50%)",
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: "#D1FF26",
        color: "#05070A",
        boxShadow: "0 0 28px rgba(209,255,38,0.65), 0 0 60px rgba(209,255,38,0.35)",
      }}
    >
      {/* Pulsing concentric rings */}
      <motion.span
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ border: "2px solid #D1FF26" }}
        animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.span
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ border: "2px solid #D1FF26" }}
        animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
      />
      <Phone size={26} className="relative" strokeWidth={2.5} />
      {/* Label tooltip */}
      <span
        className="hidden sm:block absolute right-full mr-3 font-mono text-[9px] tracking-[0.25em] uppercase whitespace-nowrap pointer-events-none px-2 py-1"
        style={{ color: "#D1FF26", background: "rgba(5,7,10,0.85)", border: "0.5px solid rgba(209,255,38,0.35)" }}
      >
        Dial Now
      </span>
    </motion.button>
  );
}