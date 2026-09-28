import ResourcePageShell from "@/components/landing/ResourcePageShell";
import CategoryAlertSignup from "@/components/landing/CategoryAlertSignup";

export default function CategoryAlerts() {
  return (
    <ResourcePageShell
      badge="// CATEGORY ALERTS"
      title="Category Alerts"
      subtitle="Subscribe to get SMS alerts when new providers join your service categories."
    >
      <CategoryAlertSignup />
    </ResourcePageShell>
  );
}