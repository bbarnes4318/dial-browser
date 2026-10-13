import { formatPhoneForDisplay } from "@/telephony/hoppwhistle";

/**
 * The props Dial Browser's ModernCallView takes, from the voice client. One
 * mapping, shared by every screen that shows a call, so they cannot drift.
 */
export function callViewProps(voice) {
  const call = voice.currentCall;
  return {
    status: voice.callViewStatus,
    muted: voice.muted,
    onMute: voice.toggleMute,
    onHangup: voice.hangupCall,
    onDigit: voice.sendDTMF,
    remoteNumber: call?.callerName || formatPhoneForDisplay(call?.phoneNumber),
    incoming: voice.callViewStatus === "incoming",
    onAccept: voice.answerCall,
    onReject: voice.rejectCall,
    answeredAt: call?.answerTime || null,
    onHold: voice.toggleHold,
    held: voice.onHold,
    // Hoppwhistle's recording state for this call; never a browser recording.
    recording: call?.recordingEnabled === true,
  };
}
