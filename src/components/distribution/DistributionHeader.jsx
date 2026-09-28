import React from "react";

const BANNER_URL =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/163ff03d9_ChatGPTImageSep23202601_44_52AM.png";

export default function DistributionHeader() {
  return (
    <div className="w-full">
      <img
        src={BANNER_URL}
        alt="Dial World Distribution — Global music distribution made simple. Reach 50 million music listeners worldwide."
        style={{
          width: "100%",
          maxWidth: "1200px",
          height: "auto",
          display: "block",
          margin: "0 auto",
          borderRadius: "2px",
        }}
      />
    </div>
  );
}