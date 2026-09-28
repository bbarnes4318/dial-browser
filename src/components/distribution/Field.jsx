import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const LABEL = "font-mono text-[9px] tracking-widest uppercase";
const INPUT_CLS = "bg-[#05070A] border-[rgba(209,255,38,0.2)] text-[#F5F5F7] placeholder:text-[#5a5f68] focus-visible:border-[rgba(209,255,38,0.5)]";

export function TextInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label className={LABEL} style={{ color: "#8A8F98" }}>{label}</Label>}
      <Input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={INPUT_CLS} />
    </div>
  );
}

export function TextArea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label className={LABEL} style={{ color: "#8A8F98" }}>{label}</Label>}
      <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={INPUT_CLS} />
    </div>
  );
}

export function StepHeader({ step, title, subtitle }) {
  return (
    <div className="mb-5">
      <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// STEP {step}</p>
      <h2 className="font-heading font-black text-2xl mt-1" style={{ color: "#F5F5F7" }}>{title}</h2>
      {subtitle && <p className="text-sm mt-1" style={{ color: "#8A8F98" }}>{subtitle}</p>}
    </div>
  );
}