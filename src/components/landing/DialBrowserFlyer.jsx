import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FLYER_URL } from "@/lib/brandLogo";

// Homepage showcase for the Dial Browser promotional flyer. Sits above the
// "Hear How It Sounds" audio-demos section. The image carries the full HUD
// branding; this just frames it and links new users to the dial-in guide.
export default function DialBrowserFlyer() {
  return (
    <section className="relative py-14 px-6" style={{ background: "#05070A" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <span style={{ color: "#8cf348" }} className="font-mono text-[10px] tracking-[0.3em] uppercase">
            // DIAL BROWSER
          </span>
        </div>
        <div
          className="relative group"
          style={{ border: "0.5px solid rgba(140,243,72,0.3)", boxShadow: "0 0 60px rgba(140,243,72,0.08)" }}
        >
          {/* scanning line */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden z-10">
            <div
              className="h-full w-1/4"
              style={{ background: "linear-gradient(90deg, transparent, #8cf348, transparent)", animation: "tickerScroll 6s linear infinite" }}
            />
          </div>
          <img
            src={FLYER_URL}
            alt="Dial Browser — Call. Connect. Browse. No WiFi Required."
            className="w-full h-auto block"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase" style={{ color: "#8A8F98" }}>
            3D Interactive Projected Content
          </p>
          <Link
            to="/dial-how-to"
            className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(140,243,72,0.3)]"
            style={{ background: "#8cf348", color: "#05070A" }}
          >
            See How To Dial In <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}