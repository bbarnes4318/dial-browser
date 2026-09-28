import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Video, Plus, LogIn, Users, Loader2, X, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";
import VideoMeetingRoom from "@/components/profile/VideoMeetingRoom";

export default function VideoChat({ user, loadingUser }) {
  const [view, setView] = useState("lobby");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [activeMeetings, setActiveMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const userName = user?.full_name || user?.email?.split("@")[0] || "Member";
  const userId = user?.id;

  useEffect(() => {
    if (view === "lobby" && !loadingUser) loadMeetings();
  }, [view, loadingUser]);

  const loadMeetings = async () => {
    try {
      const data = await base44.entities.VideoMeeting.filter({ status: "active" }, "-created_date", 10);
      setActiveMeetings(data || []);
    } catch { /* ignore */ } finally {
      setLoadingMeetings(false);
    }
  };

  const startMeeting = async () => {
    if (!userId) return;
    setStarting(true);
    setError(null);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await base44.entities.VideoMeeting.create({
        room_code: code,
        host_name: userName,
        host_user_id: userId,
        status: "active",
        participant_ids: [userId],
        participant_names: [userName],
        is_free: true,
        max_participants: 12,
      });
      setRoomCode(code);
      setView("room");
    } catch {
      setError("Could not start meeting. Try again.");
    } finally {
      setStarting(false);
    }
  };

  const joinMeeting = async (code) => {
    if (!userId || !code.trim()) return;
    setError(null);
    try {
      const meetings = await base44.entities.VideoMeeting.filter({ room_code: code.trim().toUpperCase(), status: "active" });
      if (!meetings || meetings.length === 0) {
        setError("Meeting not found. Check the code and try again.");
        return;
      }
      setRoomCode(code.trim().toUpperCase());
      setView("room");
    } catch {
      setError("Could not join meeting. Try again.");
    }
  };

  if (view === "room" && roomCode) {
    return (
      <VideoMeetingRoom
        roomCode={roomCode}
        userName={userName}
        userId={userId}
        onLeave={() => {
          setView("lobby");
          setRoomCode("");
          setJoinCode("");
          loadMeetings();
        }}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }} className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Video size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// VIDEO MEETINGS — FREE</p>
        <span className="font-mono text-[9px] px-2 py-0.5" style={{ background: "rgba(209,255,38,0.08)", color: "#D1FF26" }}>FREE</span>
      </div>

      {loadingUser ? (
        <div className="p-6 flex items-center gap-3" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
          <Loader2 size={18} className="animate-spin" style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>LOADING…</span>
        </div>
      ) : (
        <>
          {/* Start + Join */}
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <button
              onClick={startMeeting}
              disabled={starting}
              className="flex items-center justify-center gap-2 p-5 transition-all hover:shadow-[0_0_20px_rgba(209,255,38,0.15)] disabled:opacity-50"
              style={{ background: "#D1FF26", color: "#05070A" }}
            >
              {starting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              <span className="font-heading font-bold text-sm">Start Meeting</span>
            </button>
            <div className="p-3" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Room code"
                  maxLength={6}
                  className="flex-1 px-3 py-2.5 text-[16px] sm:text-sm font-mono uppercase tracking-widest"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
                />
                <button
                  onClick={() => joinMeeting(joinCode)}
                  disabled={!joinCode.trim()}
                  className="flex items-center justify-center gap-1.5 px-4 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
                  style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                >
                  <LogIn size={14} /> Join
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>
          )}

          {/* Active meetings */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Radio size={12} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>ACTIVE MEETINGS NOW</p>
            </div>
            {loadingMeetings ? (
              <div className="p-4 flex items-center justify-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <Loader2 size={16} className="animate-spin" style={{ color: "#D1FF26" }} />
              </div>
            ) : activeMeetings.length === 0 ? (
              <div className="p-6 text-center" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(209,255,38,0.1)" }}>
                <Video size={24} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 8px" }} />
                <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>NO ACTIVE MEETINGS</p>
                <p className="font-mono text-[8px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Start one and share the code with others</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeMeetings.map((m) => (
                  <div key={m.id} className="p-3 flex items-center gap-3" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.12)" }}>
                    <div className="flex items-center justify-center w-9 h-9 flex-shrink-0" style={{ background: "rgba(209,255,38,0.08)" }}>
                      <Users size={15} style={{ color: "#D1FF26" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-sm truncate" style={{ color: "#F5F5F7" }}>{m.host_name}'s Meeting</p>
                      <p className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>Code: {m.room_code}</p>
                    </div>
                    <span className="font-mono text-[8px] tracking-widest px-2 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#8A8F98" }}>
                      {(m.participant_names || []).length} IN
                    </span>
                    <button
                      onClick={() => joinMeeting(m.room_code)}
                      className="flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
                      style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                    >
                      <LogIn size={11} /> Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="font-mono text-[8px] tracking-widest mt-4 text-center" style={{ color: "rgba(138,143,152,0.4)" }}>
            FREE FOREVER · UP TO 12 PARTICIPANTS · NO TIME LIMIT · NO APP NEEDED FOR CALLERS
          </p>
        </>
      )}
    </motion.div>
  );
}