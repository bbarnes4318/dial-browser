import LazySection from "@/components/landing/LazySection";
import TabbedSection from "@/components/landing/TabbedSection";
import HowToGuide from "@/components/landing/HowToGuide";
import DialProcessExplained from "@/components/landing/DialProcessExplained";
import VoiceDemo from "@/components/landing/VoiceDemo";
import DemoCalls from "@/components/landing/DemoCalls";
import DialBrowserSearch from "@/components/landing/DialBrowserSearch";
import VoiceCommandFAQ from "@/components/landing/VoiceCommandFAQ";
import ComparisonTable from "@/components/landing/ComparisonTable";
import PhoneFeaturesHowItWorks from "@/components/landing/PhoneFeaturesHowItWorks";

export default function HowItWorksCategory() {
  return (
    <>
      <LazySection><div id="voice"><VoiceDemo /></div></LazySection>
      <TabbedSection
        id="howto-tabs"
        badge="// HOW IT WORKS"
        title="Guides & Resources"
        subtitle="Everything you need to master the Dial Browser — user manuals, comparisons, code guides, demos, and FAQs."
        tabs={[
          { label: "User Manual", content: <><HowToGuide /><DialProcessExplained /><PhoneFeaturesHowItWorks /></> },
          { label: "Guides & Compare", content: <ComparisonTable /> },
          { label: "Demos & Search", content: <><DemoCalls /><DialBrowserSearch /></> },
          { label: "FAQ", content: <VoiceCommandFAQ /> },
        ]}
      />
    </>
  );
}