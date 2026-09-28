// Automated study notifications: SMS congratulations on quiz/module milestones
// and PDF certificate delivery by email. Both resolve gracefully (no throw)
// when a learner's phone or email is missing so the calling flow is never
// blocked. Shared by course-voice-delivery and grade-exam-attempt.
import { sendTwilioSms } from "./twilioSms.ts";
import { jsPDF } from "npm:jspdf@4.0.0";

/**
 * Sends a congratulatory SMS to a learner's mobile (from their Member
 * profile). Returns {sent} without throwing so callers can fire-and-forget.
 */
export async function sendStudySms(base44: any, userId: string, message: string) {
  if (!userId || !message) return { sent: false, reason: "missing input" };
  try {
    const members = await base44.asServiceRole.entities.Member.filter(
      { created_by_id: userId }, "-created_date", 5
    );
    const phone = (members || []).map((m: any) => m.phone).find(Boolean);
    if (!phone) return { sent: false, reason: "no phone on file" };
    const result = await sendTwilioSms(phone, message);
    return { sent: result.success, messageId: result.messageId, error: result.error };
  } catch (e: any) {
    console.error("sendStudySms failed:", e.message);
    return { sent: false, reason: e.message };
  }
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(binary);
}

/**
 * Builds a PDF certificate matching the on-screen CertificateTemplate design
 * and emails it to the learner via the platform's SendEmail integration.
 * Called by grade-exam-attempt immediately after a passing final exam.
 */
export async function emailCertificatePdf(base44: any, certificateId: string, appUrl?: string) {
  if (!certificateId) return { sent: false, reason: "no certificate id" };
  const cert = await base44.asServiceRole.entities.Certificate.get(certificateId).catch(() => null);
  if (!cert) return { sent: false, reason: "certificate not found" };
  if (cert.revoked) return { sent: false, reason: "certificate revoked" };

  const course = cert.course_id
    ? await base44.asServiceRole.entities.Course.get(cert.course_id).catch(() => null)
    : null;
  const courseTitle = cert.course_title || course?.title || "Course";
  const ownerName = cert.owner_name || "Learner";
  const code = cert.verification_code || "";
  const issued = cert.issued_at
    ? new Date(cert.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const toEmail = cert.owner_email || "";
  if (!toEmail) return { sent: false, reason: "no email on file" };

  const accent: [number, number, number] = [209, 255, 38];
  const darker: [number, number, number] = [5, 7, 10];
  const muted: [number, number, number] = [138, 143, 152];
  const white: [number, number, number] = [245, 245, 247];

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  // A4 landscape ≈ 842 x 595 pt
  doc.setFillColor(...darker);
  doc.rect(0, 0, 842, 595, "F");

  // Outer accent border
  doc.setDrawColor(...accent);
  doc.setLineWidth(2);
  doc.rect(18, 18, 806, 559);
  // Inner dashed border
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([2, 3], 0);
  doc.rect(34, 34, 774, 527);
  doc.setLineDashPattern([], 0);

  // Header
  doc.setTextColor(...accent);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("1 CALL ACADEMY", 421, 80, { align: "center" });

  doc.setTextColor(...white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("CERTIFICATE OF COMPLETION", 421, 116, { align: "center" });

  doc.setDrawColor(...accent);
  doc.setLineWidth(1);
  doc.line(360, 132, 482, 132);

  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("THIS IS TO CERTIFY THAT", 421, 160, { align: "center" });

  doc.setTextColor(...white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.text((ownerName || "Learner").toUpperCase(), 421, 198, { align: "center" });

  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("HAS SUCCESSFULLY COMPLETED", 421, 226, { align: "center" });

  doc.setTextColor(...accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(courseTitle, 421, 260, { align: "center" });

  // Embossed seal
  doc.setDrawColor(...accent);
  doc.setLineWidth(2);
  doc.circle(421, 326, 26);
  doc.setLineWidth(0.5);
  doc.circle(421, 326, 22);
  doc.setTextColor(...accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("AWD", 421, 332, { align: "center" });

  // Footer divider
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(60, 428, 782, 428);

  // Left: date issued
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("DATE ISSUED", 60, 450);
  doc.setTextColor(...white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(issued, 60, 466);
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(60, 476, 200, 476);
  doc.setTextColor(...muted);
  doc.setFontSize(7);
  doc.text("1 CALL ACADEMY", 60, 490);

  // Right: verification code + verify URL
  const base = (appUrl || "https://www.dialbrowser.com").replace(/\/$/, "");
  const verifyUrl = `${base}/verify/${code}`;
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("VERIFICATION CODE", 782, 450, { align: "right" });
  doc.setTextColor(...accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(code, 782, 466, { align: "right" });
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(642, 476, 782, 476);
  doc.setTextColor(...muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(verifyUrl, 782, 490, { align: "right" });

  const b64 = arrayBufferToBase64(doc.output("arraybuffer"));

  const subject = `Your ${courseTitle} Certificate — 1 Call Academy`;
  const html = `<div style="background:#05070A;padding:32px;font-family:Inter,Arial,sans-serif;color:#F5F5F7"><div style="max-width:560px;margin:0 auto;border:1px solid rgba(209,255,38,0.4);padding:32px"><p style="color:#D1FF26;letter-spacing:0.3em;font-size:11px;margin:0">1 CALL ACADEMY</p><h1 style="font-size:22px;margin:8px 0 16px">Congratulations, ${ownerName}!</h1><p style="color:#8A8F98;line-height:1.6;font-size:14px">You passed your final exam and earned your <strong style="color:#D1FF26">${courseTitle}</strong> certificate. Your verified PDF certificate is attached. Keep your streak going — your next lesson is waiting.</p><p style="color:#8A8F98;font-size:12px;margin-top:24px">Verification code: <strong style="color:#D1FF26;font-family:monospace">${code}</strong><br/>Verify online: ${verifyUrl}</p><p style="color:#4A4F58;font-size:10px;margin-top:24px">1 Call Academy · Dial Browser</p></div></div>`;
  const text = `Congratulations, ${ownerName}! You passed your final exam and earned your ${courseTitle} certificate from 1 Call Academy. Your verified PDF certificate is attached. Verification code: ${code}. Verify online: ${verifyUrl}`;

  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: toEmail,
      subject,
      html,
      text,
      attachments: [{ filename: `1Call-Certificate-${code}.pdf`, content: b64 }],
    });
    return { sent: true, to: toEmail };
  } catch (e: any) {
    console.error("emailCertificatePdf: SendEmail failed:", e.message);
    return { sent: false, reason: e.message };
  }
}