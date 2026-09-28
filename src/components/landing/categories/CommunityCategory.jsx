import LazySection from "@/components/landing/LazySection";
import TabbedSection from "@/components/landing/TabbedSection";
import NetworkSection from "@/components/landing/NetworkSection";
import FirstDateSuggestions from "@/components/landing/FirstDateSuggestions";
import JobApplicationSection from "@/components/landing/JobApplicationSection";
import DatingSection from "@/components/landing/DatingSection";
import DatingDashboard from "@/components/landing/DatingDashboard";

export default function CommunityCategory() {
  return (
    <>
      <TabbedSection
        id="community-tabs"
        badge="// COMMUNITY"
        title="Community & Connection"
        subtitle="Real public-domain movies & TV, first-date ideas, and live job listings on the 1 Call Network."
        tabs={[
          { label: "Movies & TV", content: <NetworkSection /> },
          { label: "Social & Dating", content: <FirstDateSuggestions /> },
          { label: "Jobs", content: <JobApplicationSection /> },
        ]}
      />
      <LazySection><div id="dating"><DatingSection /></div></LazySection>
      <LazySection><div id="dating-dashboard"><DatingDashboard /></div></LazySection>
    </>
  );
}