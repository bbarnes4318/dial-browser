import React from "react";

/**
 * PhoneHeader — branded banner image at the top of the Dial Phone page.
 */
const BANNER_URL =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/31323a2ff_ChatGPTImageSep23202602_25_51AM.png";

export default function PhoneHeader() {
  return (
    <div
      className="relative overflow-hidden mb-5"
      style={{ border: "0.5px solid rgba(209,255,38,0.2)" }}
    >
      <img
        src={BANNER_URL}
        alt="Dial Phone — The Internet By Phone: Make Calls, Browse the Internet, Access Essential Services, Get Results by Voice or SMS"
        className="block w-full h-auto select-none"
        style={{ pointerEvents: "none" }}
        draggable={false}
      />
    </div>
  );
}