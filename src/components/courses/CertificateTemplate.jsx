import React from "react";
import { Award, ShieldCheck } from "lucide-react";

/**
 * CertificateTemplate — the digital completion certificate.
 * Auto-populates with the learner's name and the course title from the
 * Certificate record (written by grade-exam-attempt on a passing final exam).
 * Used by the public verification page and the owner's "View Certificate" link.
 */
export default function CertificateTemplate({
  ownerName = "Anonymous Learner",
  courseTitle = "",
  verificationCode = "",
  issuedAt = "",
  accent = "#D1FF26",
}) {
  return (
    <div
      className="relative w-full p-8 sm:p-12 text-center"
      style={{
        background: "linear-gradient(135deg, rgba(16,20,29,0.96), rgba(5,7,10,0.96))",
        border: "1px solid rgba(209,255,38,0.45)",
        boxShadow: "0 0 60px rgba(209,255,38,0.12)",
      }}
    >
      {/* Corner brackets */}
      <div className="absolute top-3 left-3 w-10 h-10" style={{ borderTop: `2px solid ${accent}`, borderLeft: `2px solid ${accent}` }} />
      <div className="absolute top-3 right-3 w-10 h-10" style={{ borderTop: `2px solid ${accent}`, borderRight: `2px solid ${accent}` }} />
      <div className="absolute bottom-3 left-3 w-10 h-10" style={{ borderBottom: `2px solid ${accent}`, borderLeft: `2px solid ${accent}` }} />
      <div className="absolute bottom-3 right-3 w-10 h-10" style={{ borderBottom: `2px solid ${accent}`, borderRight: `2px solid ${accent}` }} />
      {/* Inner thin frame */}
      <div className="absolute inset-5 pointer-events-none" style={{ border: "0.5px solid rgba(209,255,38,0.15)" }} />

      <div className="relative z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck size={20} style={{ color: accent }} />
          <p className="font-mono text-[9px] sm:text-[10px] tracking-[0.4em]" style={{ color: accent }}>1 CALL ACADEMY</p>
        </div>
        <p className="font-heading font-black text-xl sm:text-2xl tracking-[0.15em] mb-1" style={{ color: "#F5F5F7" }}>
          CERTIFICATE OF COMPLETION
        </p>
        <div className="mx-auto my-5 h-px w-24" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

        <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#8A8F98" }}>This is to certify that</p>
        <h1
          className="font-heading font-black text-2xl sm:text-4xl mb-4"
          style={{ color: "#F5F5F7", textShadow: "0 0 20px rgba(209,255,38,0.15)" }}
        >
          {ownerName}
        </h1>

        <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "#8A8F98" }}>has successfully completed</p>
        <h2 className="font-heading font-bold text-lg sm:text-2xl mb-6" style={{ color: accent }}>{courseTitle}</h2>

        {/* Embossed seal */}
        <div className="flex items-center justify-center mb-6">
          <div
            className="relative w-20 h-20 flex items-center justify-center rounded-full"
            style={{ border: `2px solid ${accent}`, boxShadow: `0 0 24px ${accent}33` }}
          >
            <Award size={34} style={{ color: accent }} />
            <div className="absolute inset-1.5 rounded-full" style={{ border: `0.5px solid ${accent}55` }} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-5" style={{ borderTop: "0.5px solid rgba(209,255,38,0.2)" }}>
          <div className="text-left">
            <p className="font-mono text-[8px] tracking-widest uppercase mb-1" style={{ color: "#8A8F98" }}>Date Issued</p>
            <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{issuedAt || "—"}</p>
            <div className="mt-2 h-px w-20" style={{ background: `${accent}66` }} />
            <p className="font-mono text-[7px] tracking-widest uppercase mt-1" style={{ color: "#8A8F98" }}>1 Call Academy</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[8px] tracking-widest uppercase mb-1" style={{ color: "#8A8F98" }}>Verification Code</p>
            <p className="font-mono text-sm font-bold" style={{ color: accent }}>{verificationCode}</p>
            <div className="mt-2 h-px w-20 ml-auto" style={{ background: `${accent}66` }} />
            <p className="font-mono text-[7px] tracking-widest uppercase mt-1" style={{ color: "#8A8F98" }}>Verify anywhere</p>
          </div>
        </div>
      </div>
    </div>
  );
}