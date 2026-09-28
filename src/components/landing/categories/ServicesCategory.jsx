import TabbedSection from "@/components/landing/TabbedSection";
import RecommendedForYou from "@/components/landing/RecommendedForYou";
import OneCallWeather from "@/components/landing/OneCallWeather";
import OneCallMedicalCenter from "@/components/landing/OneCallMedicalCenter";
import RestaurantReviewPlayer from "@/components/landing/RestaurantReviewPlayer";
import VoiceVault from "@/components/landing/VoiceVault";

export default function ServicesCategory() {
  return (
    <TabbedSection
      id="services-tabs"
      badge="// 1 CALL SERVICES"
      title="1 Call Services"
      subtitle="Every service below is accessible from a single phone call. Tap a tab to explore each category."
      tabs={[
        { label: "Recommended", content: <RecommendedForYou /> },
        { label: "Health", content: <OneCallMedicalCenter /> },
        { label: "Dining", content: <RestaurantReviewPlayer /> },
        { label: "Weather", content: <OneCallWeather /> },
        { label: "Vault", content: <VoiceVault /> },
      ]}
    />
  );
}