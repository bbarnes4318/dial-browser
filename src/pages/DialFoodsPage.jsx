import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DialFoods from "@/components/landing/DialFoods";

// Standalone Dial Foods page — reachable from the main menu tab so users can
// browse and order food outside the homepage section.
export default function DialFoodsPage() {
  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </div>
      <DialFoods />
    </div>
  );
}