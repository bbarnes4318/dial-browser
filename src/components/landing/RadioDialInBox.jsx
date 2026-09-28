import React, { useState, useEffect } from "react";
import { PhoneCall, Volume2, Loader2, Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";

function formatPhone(num) {
  if (!num) return "";
  const digits = num.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return num;
}

export default function RadioDialInBox({ station }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("get-dial-in-info", {});
        const num = res?.data?.voiceNumber || "";
        if (!cancelled) setPhoneNumber(num);
      } catch {
        /* non-blocking — the box still shows browser-only instructions */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const phoneAvailable = station.phoneStream !== false;
  const stationName = station.name;

  return (
    <div
      className="mt-4 p-4"
      style={{
        background: "rgba(16,20,29,0.6)",
        border: "0.5px solid rgba(209,255,38,0.2)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <PhoneCall size={14} style={{ color: "#D1FF26" }} />
        <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
          // DIAL-IN TO LISTEN
        </span>
      </div>

      {phoneAvailable ? (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center gap-2 px-4 py-3 flex-1"
              style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" style={{ color: "#D1FF26" }} />
              ) : (
                <Phone size={16} style={{ color: "#D1FF26" }} />
              )}
              <span className="font-mono text-lg tracking-wider" style={{ color: "#F5F5F7" }}>
                {loading ? "Loading number..." : formatPhone(phoneNumber) || "Number unavailable"}
              </span>
            </div>
          </div>
          <p className="text-xs mb-2" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
            Call the number above and say{" "}
            <span style={{ color: "#D1FF26", fontWeight: "600" }}>"play {stationName}"</span>{" "}
            to listen on any phone — no app or WiFi needed.
          </p>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: "#8A8F98" }}>
            <Volume2 size={11} style={{ color: "#D1FF26" }} />
            <span className="font-mono tracking-wider">
              SAY "PLAY {stationName.toUpperCase()}" · SAY "CHANGE STATION" OR "STOP" TO CONTROL
            </span>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs mb-2" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
            This station streams live in your browser only — phone dial-in is not available for this
            channel's audio format.
          </p>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: "#8A8F98" }}>
            <Volume2 size={11} style={{ color: "#D1FF26" }} />
            <span className="font-mono tracking-wider">CLICK "LISTEN LIVE" ABOVE TO STREAM NOW</span>
          </div>
        </div>
      )}
    </div>
  );
}