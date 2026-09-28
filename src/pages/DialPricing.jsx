import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import PremiumMembership from "@/components/landing/PremiumMembership";

export default function DialPricing() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <header
        className="sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between"
        style={{
          background: "rgba(5,7,10,0.9)",
          borderBottom: "0.5px solid rgba(209,255,38,0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]"
          style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
        >
          <Home size={12} /> Home
        </Link>
        <p className="font-heading font-black text-lg" style={{ color: "#F5F5F7" }}>
          1 CALL <span style={{ color: "#D1FF26" }}>PRICING</span>
        </p>
        <span className="w-[72px]" />
      </header>
      <PremiumMembership />
    </div>
  );
}