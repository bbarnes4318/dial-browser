import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, ShieldCheck, Loader2, XCircle, Search, Download, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRef } from "react";
import CertificateTemplate from "@/components/courses/CertificateTemplate";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function VerifyCertificate() {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualCode, setManualCode] = useState("");

  const verify = useCallback(async (c) => {
    if (!c) { setLoading(false); return; }
    try {
      const res = await base44.functions.invoke("verify-certificate", { code: c });
      setResult(res?.data || { valid: false });
    } catch {
      setResult({ valid: false });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { verify(code); }, [code, verify]);

  const issued = result?.issued_at ? new Date(result.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
  const certRef = useRef(null);

  const download = async () => {
    if (!certRef.current) return;
    try {
      const canvas = await html2canvas(certRef.current, { backgroundColor: "#05070A", scale: 2, useCORS: true });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${result?.verification_code || "certificate"}.pdf`);
    } catch { /* ignore */ }
  };

  const shareCert = async () => {
    try { await navigator.clipboard.writeText(window.location.href); } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(209,255,38,0.08) 0%, transparent 60%)" }} />
      <div className="relative z-10 w-full max-w-2xl">
        {loading ? (
          <div className="flex flex-col items-center"><Loader2 size={28} className="animate-spin mb-3" style={{ color: "#D1FF26" }} /><p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>VERIFYING…</p></div>
        ) : result?.valid ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div ref={certRef} className="p-1" style={{ background: "transparent" }}>
              <CertificateTemplate
                ownerName={result.owner_name || "Anonymous Learner"}
                courseTitle={result.course_title}
                verificationCode={result.verification_code}
                issuedAt={issued}
              />
            </div>

            <div className="flex items-center justify-center gap-2 mt-5">
              <button onClick={download} className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_14px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                <Download size={12} /> Download PDF
              </button>
              <button onClick={shareCert} className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase font-bold transition-all" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                <Share2 size={12} /> Copy Link
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4">
              <ShieldCheck size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>AUTHENTIC · VERIFIED BY 1 CALL ACADEMY</p>
            </div>

            <div className="text-center mt-6">
              <Link to="/courses" className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>▸ Browse Courses</Link>
            </div>
          </motion.div>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)", borderRadius: "50%" }}>
              <XCircle size={30} style={{ color: "#ef4444" }} />
            </div>
            <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#ef4444" }}>▸ CERTIFICATE NOT FOUND</p>
            <p className="text-sm mb-6" style={{ color: "#8A8F98" }}>This verification code is invalid or has been revoked.</p>

            {/* Manual verification */}
            <div className="max-w-sm mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Search size={13} style={{ color: "#8A8F98" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>VERIFY ANOTHER CODE</p>
              </div>
              <div className="flex gap-2">
                <input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && manualCode.trim()) window.location.href = `/verify/${manualCode.trim().toUpperCase()}`; }}
                  placeholder="1CALL-XXXXXXXX"
                  className="flex-1 px-3 py-2.5 font-mono text-xs outline-none"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
                />
                <button
                  onClick={() => { if (manualCode.trim()) window.location.href = `/verify/${manualCode.trim().toUpperCase()}`; }}
                  className="px-4 font-mono text-[9px] tracking-widest uppercase font-bold"
                  style={{ background: "#D1FF26", color: "#05070A" }}
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}