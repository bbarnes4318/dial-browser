import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <button
        type="button"
        onClick={handleGoogle}
        className="w-full h-12 flex items-center justify-center gap-2 text-sm font-medium mb-6 transition-all hover:opacity-90"
        style={{ background: "transparent", border: "0.5px solid rgba(138,143,152,0.3)", color: "#F5F5F7" }}
      >
        <GoogleIcon className="w-5 h-5" />
        Continue with Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full" style={{ borderTop: "0.5px solid rgba(138,143,152,0.2)" }} />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-3 font-mono tracking-widest" style={{ background: "#10141D", color: "#8A8F98" }}>or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" aria-hidden="true" style={{ color: "#8A8F98" }} />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-transparent font-mono text-sm"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>Password</Label>
            <Link to="/forgot-password" className="text-xs font-mono tracking-wide hover:opacity-80" style={{ color: "#D1FF26" }}>
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" aria-hidden="true" style={{ color: "#8A8F98" }} />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 bg-transparent font-mono text-sm"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 flex items-center justify-center gap-2 font-mono text-[11px] tracking-widest uppercase font-medium transition-all disabled:opacity-40"
          style={{ background: "#D1FF26", color: "#05070A" }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </button>
      </form>

      <p className="text-center mt-4" style={{ color: "#8A8F98", fontSize: 12 }}>
        <Link to="/voice-tutorial" className="font-medium hover:underline" style={{ color: "#D1FF26" }}>🎙 Set up voice login — step-by-step guide</Link>
      </p>
    </AuthLayout>
  );
}