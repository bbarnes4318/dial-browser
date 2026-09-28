import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ListChecks } from "lucide-react";

/**
 * Reusable step-by-step visual guide shown on service sections.
 * Renders numbered steps in the dark HUD / electric lime aesthetic.
 *
 * Props:
 *  - title: string (e.g. "HOW TO PAY A BILL")
 *  - steps: [{ title, description, icon }]  (icon = lucide component)
 */
export default function ServiceStepGuide({ title = "STEP-BY-STEP GUIDE", steps = [] }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="mt-10"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 transition-all hover:bg-[rgba(209,255,38,0.04)]"
        style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.25)" }}
      >
        <div className="flex items-center gap-3">
          <ListChecks size={16} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[11px] tracking-widest font-bold" style={{ color: "#D1FF26" }}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
            {steps.length} STEPS
          </span>
          <ChevronDown
            size={16}
            style={{ color: "#8A8F98", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}
          />
        </div>
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="overflow-hidden"
        >
          <div className="p-5 space-y-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.1)", borderTop: "none" }}>
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex gap-4">
                  {/* Step number */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div
                      className="w-9 h-9 flex items-center justify-center font-mono text-sm font-bold"
                      style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.4)", color: "#D1FF26" }}
                    >
                      {i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px flex-1 mt-1" style={{ background: "rgba(209,255,38,0.15)" }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      {Icon && <Icon size={14} style={{ color: "#D1FF26" }} />}
                      <h4 className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{step.title}</h4>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#8A8F98" }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}