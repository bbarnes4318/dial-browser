import { useState, useRef, useCallback, useEffect } from "react";
import { Device } from "@twilio/voice-sdk";
import { base44 } from "@/api/base44Client";

/**
 * useTwilioVoice — wraps the @twilio/voice-sdk Device so the softphone UI can
 * register as a client, place real outbound PSTN calls, and accept/reject
 * inbound calls. The access token is minted server-side by mint-voice-token.
 *
 * status: "idle" | "registering" | "connecting" | "ringing" | "in-call" | "incoming"
 */
export function useTwilioVoice() {
  const [status, setStatus] = useState("idle");
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const deviceRef = useRef(null);
  const callRef = useRef(null);

  const bindCall = useCallback((c) => {
    callRef.current = c;
    setCall(c);
    c.on("ringing", () => setStatus("ringing"));
    c.on("accept", () => setStatus("in-call"));
    c.on("reject", () => { setCall(null); callRef.current = null; setStatus("idle"); setMuted(false); });
    c.on("cancel", () => { setCall(null); callRef.current = null; setStatus("idle"); setMuted(false); });
    c.on("disconnect", () => { setCall(null); callRef.current = null; setStatus("idle"); setMuted(false); });
    c.on("error", (e) => { setError(e?.message || "Call error"); setStatus("idle"); });
  }, []);

  const register = useCallback(async () => {
    setError(null);
    setReady(false);
    let res;
    try {
      res = await base44.functions.invoke("mint-voice-token", {});
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not reach voice service.");
      return null;
    }
    const data = res?.data || res;
    if (!data || !data.token) {
      setError(data?.error || "Voice token could not be issued.");
      setStatus("idle");
      return null;
    }

    try {
      deviceRef.current?.destroy?.();
    } catch { /* ignore */ }

    const dev = new Device(data.token, { logLevel: "warn" });
    dev.on("registered", () => { setReady(true); setStatus("idle"); });
    dev.on("incoming", (c) => {
      setStatus("incoming");
      bindCall(c);
    });
    dev.on("unregistered", () => setReady(false));
    dev.on("error", (err) => setError(err?.message || "Voice device error"));
    deviceRef.current = dev;

    try {
      await dev.register();
    } catch (e) {
      setError(e?.message || "Could not register voice device.");
    }
    return dev;
  }, [bindCall]);

  const placeCall = useCallback(async (to, opts) => {
    setError(null);
    let dev = deviceRef.current;
    if (!dev || !dev.state || dev.state === "unregistered") {
      setStatus("registering");
      dev = await register();
    }
    if (!dev) return;
    setStatus("connecting");
    try {
      const c = dev.connect({ params: { To: to, ...(opts && opts.record ? { Record: "true" } : {}) } });
      bindCall(c);
    } catch (e) {
      setError(e?.message || "Could not place call.");
      setStatus("idle");
    }
  }, [register, bindCall]);

  const accept = useCallback(() => { try { callRef.current?.accept(); } catch { /* ignore */ } }, []);
  const reject = useCallback(() => { try { callRef.current?.reject(); } catch { /* ignore */ } }, []);
  const hangup = useCallback(() => { try { callRef.current?.disconnect(); } catch { /* ignore */ } }, []);
  const sendDigits = useCallback((d) => { try { callRef.current?.sendDigits(d); } catch { /* ignore */ } }, []);
  const toggleMute = useCallback(() => {
    const c = callRef.current;
    if (!c) return;
    try {
      const next = !c.isMuted();
      c.mute(next);
      setMuted(next);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => () => { try { deviceRef.current?.destroy?.(); } catch { /* ignore */ } }, []);

  return { status, call, error, muted, ready, register, placeCall, accept, reject, hangup, sendDigits, toggleMute };
}