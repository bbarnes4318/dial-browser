import React from "react";
import { UserPlus } from "lucide-react";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";

export default function FloatingControls() {
  return (
    <div className="fixed right-4 z-[52] flex flex-col items-end gap-2.5 bottom-[76px] lg:bottom-6">
      {/* Register */}
      <ControlButton onClick={() => openRegistrationModal()} color="#D1FF26" label="REGISTER" icon={UserPlus} outline />
    </div>
  );
}

function ControlButton({ onClick, color, label, icon: Icon, outline }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="relative w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full transition-transform duration-300 hover:scale-105"
      style={{
        background: outline ? "rgba(209,255,38,0.12)" : `${color}22`,
        border: `1px solid ${color}`,
        boxShadow: `0 0 14px ${color}40`,
      }}
    >
      <Icon size={18} style={{ color }} />
      <span
        className="hidden sm:block absolute right-full mr-2 font-mono text-[8px] tracking-widest whitespace-nowrap pointer-events-none"
        style={{ color: outline ? color : "rgba(138,143,152,0.7)" }}
      >
        {label}
      </span>
    </button>
  );
}