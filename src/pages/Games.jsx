import React from "react";
import RadioPhoneGames from "@/components/landing/RadioPhoneGames";

/**
 * Dedicated Dial Browser Games page — the destination for the homepage
 * "Play Now" button. Renders the full SMS game delivery experience.
 */
export default function Games() {
  return (
    <div className="min-h-screen pt-10" style={{ background: "#05070A" }}>
      <RadioPhoneGames />
    </div>
  );
}