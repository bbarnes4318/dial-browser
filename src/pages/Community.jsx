import ResourcePageShell from "@/components/landing/ResourcePageShell";
import CommunityCategory from "@/components/landing/categories/CommunityCategory";
import { HERO_LOGO_URL } from "@/lib/brandLogo";

export default function Community() {
  return (
    <ResourcePageShell
      badge="// COMMUNITY"
      title="Community & Connection"
      subtitle="Real public-domain movies & TV, first-date ideas, and live job listings — plus 1 Call Dating."
    >
      <div id="brand-banner" className="flex justify-center mb-8">
        <img
          src={HERO_LOGO_URL}
          alt="Dial Browser cyber-retro branding"
          style={{ width: "100%", maxWidth: "1100px", height: "auto", display: "block" }}
        />
      </div>
      <CommunityCategory />
    </ResourcePageShell>
  );
}