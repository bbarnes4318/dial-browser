import LazySection from "@/components/landing/LazySection";
import TabbedSection from "@/components/landing/TabbedSection";
import TechSpecs from "@/components/landing/TechSpecs";
import MonitoringDashboard from "@/components/landing/MonitoringDashboard";
import NetworkDiagnostics from "@/components/landing/NetworkDiagnostics";
import RuralBenefits from "@/components/landing/RuralBenefits";
import GlobalBridge from "@/components/landing/GlobalBridge";
import ActiveMap from "@/components/landing/ActiveMap";
import TopSignalRegions from "@/components/landing/TopSignalRegions";
import SignalSimulator from "@/components/landing/SignalSimulator";
import IndustryImpact from "@/components/landing/IndustryImpact";
import OneCallNews from "@/components/landing/OneCallNews";
import PressSection from "@/components/landing/PressSection";

export default function NetworkTechCategory({ globalImage }) {
  return (
    <>
      <TabbedSection
        id="network-tabs"
        badge="// NETWORK, TECH & NEWS"
        title="Network, Technology & News"
        subtitle="Technical specs, live operations, diagnostics, coverage maps, signal tools, and latest news — all in one place."
        tabs={[
          { label: "Tech & Diagnostics", content: <><TechSpecs /><NetworkDiagnostics /></> },
          { label: "Network Ops", content: <><MonitoringDashboard /><SignalSimulator /></> },
          { label: "Coverage & Regions", content: <><ActiveMap /><TopSignalRegions /></> },
          { label: "Impact & Bridge", content: <><RuralBenefits /><GlobalBridge globalImage={globalImage} /></> },
          { label: "News & Press", content: <><OneCallNews /><PressSection /></> },
        ]}
      />
      <LazySection><div id="impact-ecosystem"><IndustryImpact /></div></LazySection>
    </>
  );
}