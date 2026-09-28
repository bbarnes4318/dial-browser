import React from "react";

const BANNER_URL =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/5e09e6035_Gemini_Generated_Image_5sdmdi5sdmdi5sdm.jpg";

// Radio section banner — renders the supplied Dial Radio Station banner image
// above the radio section on the homepage and as the top header on the Radio
// station page.
export default function DialRadioStationHeader() {
  return (
    <header className="relative w-full overflow-hidden" style={{ background: "#0A0D0A" }}>
      <img
        src={BANNER_URL}
        alt="Dial Radio Station — Connect. Listen. Explore."
        className="block w-full h-auto"
        style={{ userSelect: "none" }}
        draggable={false}
      />
    </header>
  );
}