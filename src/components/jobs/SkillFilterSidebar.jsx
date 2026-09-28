import React, { useState } from "react";
import { Check, RotateCcw, Cpu, TrendingUp, ChevronDown } from "lucide-react";

const COMMON_SKILLS = [
  "JavaScript", "Python", "React", "Node", "SQL", "AWS", "Docker", "Git",
  "TypeScript", "SEO", "Figma", "Photoshop", "Salesforce", "Forklift",
  "VoIP", "Arduino",
];

const EXP_LEVELS = [
  { id: "entry", label: "Entry", sub: "0-2 years" },
  { id: "mid", label: "Mid", sub: "3-5 years" },
  { id: "senior", label: "Senior", sub: "6+ years" },
];

function FilterCheckbox({ checked, onClick, label, sub }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 p-2 transition-all text-left hover:bg-[rgba(209,255,38,0.03)]"
      style={{ background: checked ? "rgba(209,255,38,0.04)" : "transparent" }}
    >
      <div
        className="w-4 h-4 flex items-center justify-center flex-shrink-0"
        style={{
          background: checked ? "#D1FF26" : "rgba(16,20,29,0.6)",
          border: `0.5px solid ${checked ? "#D1FF26" : "rgba(209,255,38,0.2)"}`,
        }}
      >
        {checked && <Check size={10} style={{ color: "#05070A" }} />}
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-xs font-medium" style={{ color: checked ? "#D1FF26" : "#F5F5F7" }}>{label}</span>
        {sub && <span className="block font-mono text-[7px] mt-0.5" style={{ color: "rgba(138,143,152,0.6)" }}>{sub}</span>}
      </div>
    </button>
  );
}

export default function SkillFilterSidebar({
  selectedSkills,
  toggleSkill,
  selectedExp,
  toggleExp,
  onClear,
  availableSkills = [],
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const allSkills = [...new Set([...COMMON_SKILLS, ...availableSkills])].sort();
  const totalActive = selectedSkills.size + selectedExp.size;

  return (
    <div className="lg:sticky lg:top-24">
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden w-full flex items-center justify-between p-3 mb-3"
        style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}
      >
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
          <Cpu size={12} /> SKILL FILTERS
          {totalActive > 0 && (
            <span className="font-mono text-[8px] px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.15)", color: "#D1FF26" }}>{totalActive}</span>
          )}
        </span>
        <ChevronDown size={14} style={{ color: "#8A8F98", transform: mobileOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
      </button>

      <div className={`${mobileOpen ? "block" : "hidden"} lg:block`}>
        <div className="p-4 space-y-5" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>
              <Cpu size={11} /> FILTERS
            </span>
            {totalActive > 0 && (
              <button onClick={onClear} className="flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
                <RotateCcw size={9} /> Clear
              </button>
            )}
          </div>

          {/* Experience levels */}
          <div>
            <p className="flex items-center gap-1.5 font-mono text-[8px] tracking-widest mb-2.5" style={{ color: "#8A8F98" }}>
              <TrendingUp size={10} /> EXPERIENCE LEVEL
            </p>
            <div className="space-y-0.5">
              {EXP_LEVELS.map((lvl) => (
                <FilterCheckbox
                  key={lvl.id}
                  checked={selectedExp.has(lvl.id)}
                  onClick={() => toggleExp(lvl.id)}
                  label={lvl.label}
                  sub={lvl.sub}
                />
              ))}
            </div>
          </div>

          {/* Technologies */}
          <div>
            <p className="flex items-center gap-1.5 font-mono text-[8px] tracking-widest mb-2.5" style={{ color: "#8A8F98" }}>
              <Cpu size={10} /> TECHNOLOGIES & SKILLS
            </p>
            <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
              {allSkills.map((skill) => (
                <FilterCheckbox
                  key={skill}
                  checked={selectedSkills.has(skill)}
                  onClick={() => toggleSkill(skill)}
                  label={skill}
                />
              ))}
            </div>
          </div>

          {/* Active count */}
          {totalActive > 0 && (
            <p className="font-mono text-[8px] tracking-widest pt-2" style={{ color: "rgba(138,143,152,0.5)", borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
              {totalActive} filter{totalActive === 1 ? "" : "s"} active
            </p>
          )}
        </div>
      </div>
    </div>
  );
}