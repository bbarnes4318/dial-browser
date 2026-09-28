import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, ScreenShare, MonitorOff, PhoneOff, Copy, Check, Users, Loader2, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

function ParticipantTile({ stream, name, isLocal, micOn, camOn, isSharing }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, camOn]);

  return (
    <div
      className="relative aspect-video rounded-lg overflow-hidden flex items-center justify-center"
      style={{ background: "#0A0E15", border: `0.5px solid ${isLocal ? "rgba(209,255,38,0.4)" : "rgba(209,255,38,0.15)"}` }}
    >
      {stream && camOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
          style={{ transform: isLocal ? "scaleX(-1)" : "none" }}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full"
            style={{ background: "rgba(209,255,38,0.08)", border: "1px solid rgba(209,255,38,0.3)" }}
          >
            <span className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>
              {name?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
        </div>
      )}
      <div
        className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded"
        style={{ background: "rgba(5,7,10,0.8)" }}
      >
        {!micOn && <MicOff size={10} style={{ color: "#ef4444" }} />}
        <span className="font-mono text-[9px]" style={{ color: isLocal ? "#D1FF26" : "#F5F5F7" }}>
          {isLocal ? `You${isSharing ? " · Sharing" : ""}` : name || "Participant"}
        </span>
      </div>
    </div>
  );
}

export default function VideoMeetingRoom({ roomCode, userName, userId, onLeave }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [participantInfo, setParticipantInfo] = useState({});
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const screenStreamRef = useRef(null);
  const originalVideoTrackRef = useRef(null);
  const signalUnsubRef = useRef(null);
  const meetingUnsubRef = useRef(null);
  const meetingIdRef = useRef(null);
  const cleanupDoneRef = useRef(false);
  const timerRef = useRef(null);

  const myUserId = userId;
  const myName = userName;
  const roomCodeRef = useRef(roomCode);

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        originalVideoTrackRef.current = stream.getVideoTracks()[0];
        setParticipantInfo({ [myUserId]: myName });

        // Fetch meeting
        const meetings = await base44.entities.VideoMeeting.filter({ room_code: roomCode, status: "active" });
        if (meetings && meetings.length > 0) {
          const meeting = meetings[0];
          meetingIdRef.current = meeting.id;

          const currentIds = meeting.participant_ids || [];
          const currentNames = meeting.participant_names || [];

          // Add self to participants if not already there
          if (!currentIds.includes(myUserId)) {
            await base44.entities.VideoMeeting.update(meeting.id, {
              participant_ids: [...currentIds, myUserId],
              participant_names: [...currentNames, myName],
            });
          }

          // Initiate connections to existing participants where my userId < theirs
          for (let i = 0; i < currentIds.length; i++) {
            const remoteId = currentIds[i];
            if (remoteId === myUserId) continue;
            const remoteName = currentNames[i] || "Participant";
            setParticipantInfo((prev) => ({ ...prev, [remoteId]: remoteName }));
            if (myUserId < remoteId) {
              initiateConnection(remoteId);
            }
          }
        }

        // Subscribe to signals for this room
        signalUnsubRef.current = base44.entities.VideoSignal.subscribe((event) => {
          if (
            event.type === "create" &&
            event.data.room_code === roomCode &&
            event.data.to_user_id === myUserId
          ) {
            handleSignal(event.data);
          }
        });

        // Subscribe to meeting updates to detect new participants
        meetingUnsubRef.current = base44.entities.VideoMeeting.subscribe((event) => {
          if (event.type === "update" && event.data.room_code === roomCode) {
            handleMeetingUpdate(event.data);
          }
        });

        timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
        setLoading(false);
      } catch (err) {
        setError("Could not access camera or microphone. Please check your browser permissions and try again.");
        setLoading(false);
      }
    };
    init();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPeerConnection = (remoteUserId) => {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        base44.entities.VideoSignal.create({
          room_code: roomCode,
          from_user_id: myUserId,
          from_user_name: myName,
          to_user_id: remoteUserId,
          signal_type: "ice",
          candidate: JSON.stringify(event.candidate),
        }).catch(() => {});
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setRemoteStreams((prev) => ({ ...prev, [remoteUserId]: stream }));
    };

    return pc;
  };

  const initiateConnection = (remoteUserId) => {
    if (peerConnectionsRef.current[remoteUserId]) return;
    const pc = createPeerConnection(remoteUserId);
    peerConnectionsRef.current[remoteUserId] = pc;
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() =>
        base44.entities.VideoSignal.create({
          room_code: roomCode,
          from_user_id: myUserId,
          from_user_name: myName,
          to_user_id: remoteUserId,
          signal_type: "offer",
          sdp: JSON.stringify(pc.localDescription),
        })
      )
      .catch(() => {});
  };

  const handleSignal = async (signal) => {
    try {
      if (signal.signal_type === "offer") {
        setParticipantInfo((prev) => ({
          ...prev,
          [signal.from_user_id]: signal.from_user_name || "Participant",
        }));

        let pc = peerConnectionsRef.current[signal.from_user_id];
        if (!pc) {
          pc = createPeerConnection(signal.from_user_id);
          peerConnectionsRef.current[signal.from_user_id] = pc;
        }
        await pc.setRemoteDescription(JSON.parse(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await base44.entities.VideoSignal.create({
          room_code: roomCode,
          from_user_id: myUserId,
          from_user_name: myName,
          to_user_id: signal.from_user_id,
          signal_type: "answer",
          sdp: JSON.stringify(answer),
        });
      } else if (signal.signal_type === "answer") {
        const pc = peerConnectionsRef.current[signal.from_user_id];
        if (pc && pc.signalingState !== "stable") {
          await pc.setRemoteDescription(JSON.parse(signal.sdp));
        }
      } else if (signal.signal_type === "ice") {
        const pc = peerConnectionsRef.current[signal.from_user_id];
        if (pc) {
          await pc.addIceCandidate(JSON.parse(signal.candidate));
        }
      }
      // Clean up signal after processing
      try {
        await base44.entities.VideoSignal.delete(signal.id);
      } catch { /* ignore */ }
    } catch (err) {
      // ignore signal processing errors
    }
  };

  const handleMeetingUpdate = (meeting) => {
    const ids = meeting.participant_ids || [];
    const names = meeting.participant_names || [];

    for (let i = 0; i < ids.length; i++) {
      const remoteId = ids[i];
      if (remoteId === myUserId) continue;
      const remoteName = names[i] || "Participant";
      setParticipantInfo((prev) => ({ ...prev, [remoteId]: remoteName }));

      // If I haven't connected yet and my userId < theirs, I initiate
      if (!peerConnectionsRef.current[remoteId] && myUserId < remoteId) {
        initiateConnection(remoteId);
      }
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamOn(videoTrack.enabled);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });
      setSharing(true);
      screenTrack.onended = () => stopScreenShare();
    } catch { /* user cancelled */ }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    const videoTrack = originalVideoTrackRef.current;
    if (videoTrack) {
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(videoTrack);
      });
    }
    setSharing(false);
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(`Join my 1 Call Away video meeting! Room code: ${roomCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const cleanup = () => {
    if (cleanupDoneRef.current) return;
    cleanupDoneRef.current = true;

    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      try { pc.close(); } catch { /* ignore */ }
    });
    peerConnectionsRef.current = {};

    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    // Unsubscribe
    if (signalUnsubRef.current) signalUnsubRef.current();
    if (meetingUnsubRef.current) meetingUnsubRef.current();
    if (timerRef.current) clearInterval(timerRef.current);

    // Update meeting record — remove self (fire and forget)
    if (meetingIdRef.current) {
      base44.entities.VideoMeeting.get(meetingIdRef.current)
        .then((meeting) => {
          const ids = meeting.participant_ids || [];
          const names = meeting.participant_names || [];
          const newIds = ids.filter((id) => id !== myUserId);
          const newNames = ids.map((id, i) => (id !== myUserId ? names[i] : null)).filter(Boolean);
          if (newIds.length === 0) {
            return base44.entities.VideoMeeting.update(meetingIdRef.current, {
              status: "ended",
              participant_ids: [],
              participant_names: [],
            });
          } else {
            return base44.entities.VideoMeeting.update(meetingIdRef.current, {
              participant_ids: newIds,
              participant_names: newNames,
            });
          }
        })
        .catch(() => {});
    }
  };

  const handleLeave = () => {
    cleanup();
    onLeave();
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const allParticipantIds = Object.keys(participantInfo);
  const participantCount = allParticipantIds.length;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "#05070A" }}>
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>JOINING MEETING…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: "#05070A" }}>
        <div className="text-center max-w-sm">
          <VideoOff size={32} style={{ color: "#ef4444", margin: "0 auto 12px" }} />
          <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#ef4444" }}>⚠ CAMERA ACCESS NEEDED</p>
          <p className="text-sm mb-6" style={{ color: "#8A8F98", lineHeight: 1.6 }}>{error}</p>
          <button
            onClick={handleLeave}
            className="px-6 py-3 font-mono text-[10px] tracking-widest uppercase"
            style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
          >
            <ArrowLeft size={13} className="inline mr-1" /> Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "#05070A" }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: "rgba(16,20,29,0.8)", borderBottom: "0.5px solid rgba(209,255,38,0.15)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#D1FF26" }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>LIVE</span>
          </div>
          <span className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>{fmtTime(elapsed)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-widest" style={{ color: "#F5F5F7" }}>ROOM {roomCode}</span>
          <button
            onClick={copyInvite}
            className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
            style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}
          >
            {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? "Copied" : "Invite"}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <Users size={13} style={{ color: "#8A8F98" }} />
          <span className="font-mono text-[10px]" style={{ color: "#8A8F98" }}>{participantCount}</span>
        </div>
      </div>

      {/* Video grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div
          className={`grid gap-3 mx-auto max-w-6xl ${
            participantCount <= 1
              ? "grid-cols-1 max-w-3xl"
              : participantCount <= 2
              ? "grid-cols-1 sm:grid-cols-2 max-w-4xl"
              : participantCount <= 4
              ? "grid-cols-2 max-w-4xl"
              : participantCount <= 6
              ? "grid-cols-2 lg:grid-cols-3"
              : "grid-cols-3 lg:grid-cols-4"
          }`}
        >
          {/* Local tile */}
          <ParticipantTile
            stream={localStream}
            name={myName}
            isLocal
            micOn={micOn}
            camOn={camOn}
            isSharing={sharing}
          />
          {/* Remote tiles */}
          {allParticipantIds
            .filter((id) => id !== myUserId)
            .map((remoteId) => (
              <ParticipantTile
                key={remoteId}
                stream={remoteStreams[remoteId]}
                name={participantInfo[remoteId]}
                isLocal={false}
                micOn
                camOn
              />
            ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className="flex items-center justify-center gap-3 px-4 py-4 flex-shrink-0"
        style={{ background: "rgba(16,20,29,0.8)", borderTop: "0.5px solid rgba(209,255,38,0.15)" }}
      >
        <button
          onClick={toggleMic}
          className="flex flex-col items-center gap-1 p-2 transition-all"
          title={micOn ? "Mute" : "Unmute"}
        >
          <span
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all"
            style={{
              background: micOn ? "rgba(209,255,38,0.08)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${micOn ? "rgba(209,255,38,0.3)" : "#ef4444"}`,
            }}
          >
            {micOn ? <Mic size={18} style={{ color: "#D1FF26" }} /> : <MicOff size={18} style={{ color: "#ef4444" }} />}
          </span>
          <span className="font-mono text-[8px] tracking-widest" style={{ color: micOn ? "#8A8F98" : "#ef4444" }}>
            {micOn ? "MUTE" : "UNMUTE"}
          </span>
        </button>

        <button
          onClick={toggleCam}
          className="flex flex-col items-center gap-1 p-2 transition-all"
          title={camOn ? "Camera off" : "Camera on"}
        >
          <span
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all"
            style={{
              background: camOn ? "rgba(209,255,38,0.08)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${camOn ? "rgba(209,255,38,0.3)" : "#ef4444"}`,
            }}
          >
            {camOn ? <Video size={18} style={{ color: "#D1FF26" }} /> : <VideoOff size={18} style={{ color: "#ef4444" }} />}
          </span>
          <span className="font-mono text-[8px] tracking-widest" style={{ color: camOn ? "#8A8F98" : "#ef4444" }}>
            {camOn ? "CAM OFF" : "CAM ON"}
          </span>
        </button>

        <button
          onClick={sharing ? stopScreenShare : startScreenShare}
          className="flex flex-col items-center gap-1 p-2 transition-all"
          title={sharing ? "Stop sharing" : "Share screen"}
        >
          <span
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all"
            style={{
              background: sharing ? "rgba(209,255,38,0.15)" : "rgba(209,255,38,0.08)",
              border: `1px solid ${sharing ? "#D1FF26" : "rgba(209,255,38,0.3)"}`,
            }}
          >
            {sharing ? <MonitorOff size={18} style={{ color: "#D1FF26" }} /> : <ScreenShare size={18} style={{ color: "#D1FF26" }} />}
          </span>
          <span className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>
            {sharing ? "STOP" : "SHARE"}
          </span>
        </button>

        <button
          onClick={handleLeave}
          className="flex flex-col items-center gap-1 p-2 transition-all"
          title="Leave meeting"
        >
          <span
            className="flex items-center justify-center w-12 h-12 rounded-full transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            style={{ background: "#ef4444", border: "1px solid #ef4444" }}
          >
            <PhoneOff size={18} style={{ color: "#fff" }} />
          </span>
          <span className="font-mono text-[8px] tracking-widest" style={{ color: "#ef4444" }}>LEAVE</span>
        </button>
      </div>
    </div>
  );
}