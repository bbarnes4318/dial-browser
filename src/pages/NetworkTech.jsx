import ResourcePageShell from "@/components/landing/ResourcePageShell";
import NetworkTechCategory from "@/components/landing/categories/NetworkTechCategory";

const GLOBAL_IMG = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=6000&auto=format&fit=crop";

export default function NetworkTech() {
  return (
    <ResourcePageShell
      badge="// NETWORK, TECH & NEWS"
      title="Network, Technology & News"
      subtitle="Technical specs, live operations, diagnostics, coverage maps, signal tools, and latest news — all in one place."
    >
      <div className="flex justify-center px-4 py-10" style={{ background: "#05070A" }}>
        <img
          src="https://media.base44.com/images/public/6a422320311efd575ae6536c/865ff0136_Gemini_Generated_Image_f37abqf37abqf37a.jpg"
          alt="Dial Browser — holographic secure-access phone with daily news interface"
          style={{ width: "100%", maxWidth: "1200px", height: "auto", display: "block", borderRadius: "2px" }}
        />
      </div>
      <NetworkTechCategory globalImage={GLOBAL_IMG} />
    </ResourcePageShell>
  );
}