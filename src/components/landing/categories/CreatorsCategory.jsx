import TabbedSection from "@/components/landing/TabbedSection";
import MusicSection from "@/components/landing/MusicSection";
import HostSpotlight from "@/components/landing/HostSpotlight";

export default function CreatorsCategory({ creatorImage }) {
  return (
    <TabbedSection
      id="creators-tabs"
      badge="// CREATORS & BROADCASTING"
      title="Creators & Broadcasting"
      subtitle="The creator economy and host spotlights — all in one place. Radio, studio, and playlists now live in their own unified section above."
      defaultTab={0}
      tabs={[
        { label: "Creator Economy", content: <MusicSection /> },
        { label: "Spotlight", content: <HostSpotlight /> },
      ]}
    />
  );
}