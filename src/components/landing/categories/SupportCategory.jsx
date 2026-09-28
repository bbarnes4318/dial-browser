import TabbedSection from "@/components/landing/TabbedSection";
import SecurityPrivacy from "@/components/landing/SecurityPrivacy";
import SecurityPrivacyBanner from "@/components/landing/SecurityPrivacyBanner";
import InteractiveFAQ from "@/components/landing/InteractiveFAQ";
import DisputeSection from "@/components/landing/DisputeSection";
import BrutalistFooter from "@/components/landing/BrutalistFooter";

export default function SupportCategory() {
  return (
    <TabbedSection
      id="support-tabs"
      badge="// HELP & SUPPORT"
      title="Help & Support"
      subtitle="Security guidance, AI answers, dispute resolution, and contact info."
      tabs={[
        { label: "Security & Guide", content: <><SecurityPrivacyBanner /><SecurityPrivacy /></> },
        { label: "Help & AI Answers", content: <InteractiveFAQ /> },
        { label: "Disputes & Contact", content: <><DisputeSection /><BrutalistFooter /></> },
      ]}
    />
  );
}