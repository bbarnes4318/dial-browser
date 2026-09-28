import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

const inputStyle = { background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" };
const labelClass = "font-mono text-[10px] tracking-widest uppercase";
const labelStyle = { color: "#8A8F98" };
const iconStyle = { color: "#8A8F98" };
const btnClass = "w-full h-12 flex items-center justify-center gap-2 font-mono text-[11px] tracking-widest uppercase font-medium transition-all disabled:opacity-40";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Reset password"
      subtitle="We'll send you a link to reset it"
      footer={
        <Link to="/login" className="font-mono tracking-wide hover:opacity-80 inline-flex items-center" style={{ color: "#D1FF26" }}>
          <ArrowLeft className="w-3 h-3 inline mr-1" />Back to log in
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-center leading-relaxed" style={{ color: "#F5F5F7" }}>
          If an account exists with that email, you'll receive a password reset link shortly.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className={labelClass} style={labelStyle}>Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" aria-hidden="true" style={iconStyle} />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-transparent font-mono text-sm"
                style={inputStyle}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className={btnClass}
            style={{ background: "#D1FF26", color: "#05070A" }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}