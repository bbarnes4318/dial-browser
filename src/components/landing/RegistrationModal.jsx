import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, LogIn, Mail, Lock, Phone, User, Loader2, Check, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const OPEN_EVENT = "open-registration-modal";

export function openRegistrationModal() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

const STEPS = [
  { num: 1, label: "Create Account", desc: "Enter your name, phone, email, and password" },
  { num: 2, label: "Verify Email", desc: "Enter the 6-digit code sent to your email" },
  { num: 3, label: "Get Connected", desc: "Receive your dial code and start calling" },
];

export default function RegistrationModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("register"); // "register" | "login"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", confirm: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [otpCode, setOtpCode] = useState("");
  const [refCode, setRefCode] = useState("");

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, []);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setRefCode(ref);
  }, []);

  const close = () => {
    setOpen(false);
    setError("");
    setShowOtp(false);
    setOtpCode("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email: form.email, password: form.password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: form.email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      // Save name + phone on the user profile and create a Member record
      try {
        await base44.auth.updateMe({ full_name: form.name });
        await base44.entities.Member.create({
          full_name: form.name,
          phone: form.phone,
          onboarding_completed: false,
        });
      } catch { /* non-blocking — user is registered regardless */ }
      // Complete the referral attribution: mark the inviter's referral as
      // completed, award credits, and unlock loyalty milestone progress.
      if (refCode) {
        try {
          await base44.functions.invoke("complete-referral", { referred_by_code: refCode, new_user_name: form.name });
        } catch { /* non-blocking — registration already succeeded */ }
      }
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(form.email);
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(loginForm.email, loginForm.password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(5,7,10,0.88)", backdropFilter: "blur(6px)" }}
            onClick={close}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain pointer-events-auto"
              style={{
                background: "rgba(10,13,20,0.98)",
                border: "0.5px solid rgba(209,255,38,0.3)",
                boxShadow: "0 20px 80px rgba(0,0,0,0.7)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Signal line accent */}
              <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
                <div className="h-full w-1/4" style={{ background: "linear-gradient(90deg, transparent, #D1FF26, transparent)", animation: "tickerScroll 3s linear infinite" }} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between p-5" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.12)" }}>
                <div className="flex items-center gap-2">
                  {mode === "register" ? <UserPlus size={14} style={{ color: "#D1FF26" }} /> : <LogIn size={14} style={{ color: "#D1FF26" }} />}
                  <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>
                    {showOtp ? "// VERIFY EMAIL" : mode === "register" ? "// REGISTRATION" : "// MEMBER LOGIN"}
                  </p>
                </div>
                <button onClick={close} className="p-1.5 transition-colors hover:bg-[rgba(239,68,68,0.1)]">
                  <X size={16} style={{ color: "#8A8F98" }} />
                </button>
              </div>

              <div className="p-5 lg:p-6">
                {/* OTP verification step */}
                {showOtp ? (
                  <div>
                    <h3 className="font-heading font-black text-2xl mb-2" style={{ color: "#F5F5F7" }}>Verify Your Email</h3>
                    <p className="text-sm mb-6" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                      We sent a 6-digit verification code to <span style={{ color: "#D1FF26" }}>{form.email}</span>. Enter it below to activate your account.
                    </p>
                    {error && <div className="mb-4 p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>{error}</div>}
                    <div className="flex justify-center mb-6">
                      <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                        <InputOTPGroup>
                          <InputOTPSlot index={0} style={{ background: "rgba(16,20,29,0.8)", borderColor: "rgba(209,255,38,0.2)" }} />
                          <InputOTPSlot index={1} style={{ background: "rgba(16,20,29,0.8)", borderColor: "rgba(209,255,38,0.2)" }} />
                          <InputOTPSlot index={2} style={{ background: "rgba(16,20,29,0.8)", borderColor: "rgba(209,255,38,0.2)" }} />
                          <InputOTPSlot index={3} style={{ background: "rgba(16,20,29,0.8)", borderColor: "rgba(209,255,38,0.2)" }} />
                          <InputOTPSlot index={4} style={{ background: "rgba(16,20,29,0.8)", borderColor: "rgba(209,255,38,0.2)" }} />
                          <InputOTPSlot index={5} style={{ background: "rgba(16,20,29,0.8)", borderColor: "rgba(209,255,38,0.2)" }} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <button onClick={handleVerifyOtp} disabled={loading || otpCode.length < 6} className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-40" style={{ background: "#D1FF26", color: "#05070A" }}>
                      {loading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Verify & Activate
                    </button>
                    <p className="text-center mt-4" style={{ color: "#8A8F98", fontSize: 12 }}>
                      Didn't receive the code?{" "}
                      <button onClick={handleResendOtp} className="font-medium hover:underline" style={{ color: "#D1FF26" }}>Resend</button>
                    </p>
                  </div>
                ) : mode === "register" ? (
                  /* Registration form */
                  <div>
                    <h3 className="font-heading font-black text-2xl mb-2" style={{ color: "#F5F5F7" }}>Join the Network</h3>
                    <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                      Create your 1 Call Away™ account to get a personal dial code and start accessing services by voice.
                    </p>

                    {/* Instructions */}
                    <div className="mb-5 p-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                      <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: "#D1FF26" }}>HOW IT WORKS</p>
                      <div className="space-y-2.5">
                        {STEPS.map((step) => (
                          <div key={step.num} className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 font-mono text-[9px] font-bold" style={{ background: "rgba(209,255,38,0.12)", color: "#D1FF26", border: "0.5px solid rgba(209,255,38,0.3)" }}>{step.num}</div>
                            <div>
                              <p className="text-[11px] font-semibold" style={{ color: "#F5F5F7" }}>{step.label}</p>
                              <p className="text-[10px]" style={{ color: "#8A8F98", lineHeight: 1.4 }}>{step.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {error && <div className="mb-4 p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>{error}</div>}

                    <form onSubmit={handleRegister} className="space-y-3">
                      <FormField icon={User} placeholder="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                      <FormField icon={Phone} placeholder="Phone number" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
                      <FormField icon={Mail} placeholder="Email address" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                      <FormField icon={Lock} placeholder="Password (min 6 characters)" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
                      <FormField icon={Lock} placeholder="Confirm password" type="password" value={form.confirm} onChange={(v) => setForm({ ...form, confirm: v })} required />
                      <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-40 mt-2" style={{ background: "#D1FF26", color: "#05070A" }}>
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />} Create Account
                      </button>
                    </form>

                    <p className="text-center mt-4 text-xs" style={{ color: "#8A8F98" }}>
                      Already registered?{" "}
                      <button onClick={() => { setMode("login"); setError(""); }} className="font-medium hover:underline" style={{ color: "#D1FF26" }}>Login here</button>
                    </p>
                  </div>
                ) : (
                  /* Login form */
                  <div>
                    <h3 className="font-heading font-black text-2xl mb-2" style={{ color: "#F5F5F7" }}>Welcome Back</h3>
                    <p className="text-sm mb-5" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                      Login with your email and password to access your dial code and saved services.
                    </p>
                    {error && <div className="mb-4 p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>{error}</div>}
                    <form onSubmit={handleLogin} className="space-y-3">
                      <FormField icon={Mail} placeholder="Email address" type="email" value={loginForm.email} onChange={(v) => setLoginForm({ ...loginForm, email: v })} required />
                      <FormField icon={Lock} placeholder="Password" type="password" value={loginForm.password} onChange={(v) => setLoginForm({ ...loginForm, password: v })} required />
                      <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.3)] disabled:opacity-40 mt-2" style={{ background: "#D1FF26", color: "#05070A" }}>
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <LogIn size={13} />} Login
                      </button>
                    </form>
                    <p className="text-center mt-4 text-xs" style={{ color: "#8A8F98" }}>
                      New to 1 Call Away?{" "}
                      <button onClick={() => { setMode("register"); setError(""); }} className="font-medium hover:underline" style={{ color: "#D1FF26" }}>Register here</button>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function FormField({ icon: Icon, placeholder, value, onChange, type = "text", required }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: "#8A8F98" }} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full pl-9 pr-3 py-3 text-[16px] sm:text-sm outline-none"
        style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }}
      />
    </div>
  );
}