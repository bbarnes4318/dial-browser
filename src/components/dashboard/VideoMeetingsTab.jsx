import React from "react";
import VideoChat from "@/components/profile/VideoChat";
import { useAuth } from "@/lib/AuthContext";

export default function VideoMeetingsTab() {
  const { user, isLoadingAuth } = useAuth();
  return <VideoChat user={user} loadingUser={isLoadingAuth} />;
}