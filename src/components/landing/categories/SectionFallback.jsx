export default function SectionFallback() {
  return (
    <div className="snap-section flex items-center justify-center py-20" style={{ minHeight: "300px", background: "#05070A" }}>
      <div className="w-6 h-6 border-2 border-[rgba(209,255,38,0.2)] border-t-[#D1FF26] rounded-full animate-spin" />
    </div>
  );
}