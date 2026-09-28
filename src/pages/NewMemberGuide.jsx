import ResourcePageShell from "@/components/landing/ResourcePageShell";
import OnboardingFAQ from "@/components/landing/OnboardingFAQ";

export default function NewMemberGuide() {
  return (
    <ResourcePageShell
      badge="// NEW MEMBER GUIDE"
      title="New Member Guide"
      subtitle="Everything new members need to get started with 1 Call Away."
    >
      <OnboardingFAQ />
    </ResourcePageShell>
  );
}