import ResourcePageShell from "@/components/landing/ResourcePageShell";
import HowItWorksCategory from "@/components/landing/categories/HowItWorksCategory";

export default function HowItWorks() {
  return (
    <ResourcePageShell
      badge="// HOW IT WORKS"
      title="How It Works"
      subtitle="Everything you need to master the Dial Browser — user manuals, comparisons, code guides, demos, and FAQs."
    >
      <HowItWorksCategory />
    </ResourcePageShell>
  );
}