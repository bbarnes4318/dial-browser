import React from "react";
import PortalLeftNav from "./PortalLeftNav";
import PortalRightRail from "./PortalRightRail";
import { PORTAL } from "./portalTheme";

/**
 * Three-column neon portal layout that coexists with the app's global sidebar:
 * left nav (with TAP TO SPEAK) · center feed · right rail (VOICE + Recent Activity).
 */
export default function PortalShell({ myProfile, active, onVoiceCommand, rightExtra, children }) {
  return (
    <div className="min-h-screen w-full" style={{ background: PORTAL.bg }}>
      <div className="mx-auto max-w-[1400px] px-3 lg:px-5 py-4">
        <div className="grid gap-3 lg:grid-cols-[210px_minmax(0,1fr)_290px]">
          <PortalLeftNav myProfile={myProfile} active={active} onVoiceCommand={onVoiceCommand} className="hidden lg:flex" />
          <main className="min-w-0">{children}</main>
          <PortalRightRail myProfile={myProfile} onVoiceCommand={onVoiceCommand} extra={rightExtra} className="hidden lg:flex" />
        </div>
      </div>
    </div>
  );
}