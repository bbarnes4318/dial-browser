import React from "react";
import { TextInput, TextArea, StepHeader } from "../Field";
import MediaUpload from "../MediaUpload";

export default function StepArtistProfile({ data, update }) {
  return (
    <div>
      <StepHeader step="01" title="Artist Profile" subtitle="Build the foundation for your distribution campaign." />
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="Artist or Record Label Name *" value={data.artist_or_label_name} onChange={(v) => update("artist_or_label_name", v)} placeholder="e.g. SoundScape Records" />
        <TextInput label="Artist Name" value={data.artist_name} onChange={(v) => update("artist_name", v)} placeholder="Stage name" />
        <TextInput label="Contact Name" value={data.contact_name} onChange={(v) => update("contact_name", v)} />
        <TextInput label="Contact Email" type="email" value={data.contact_email} onChange={(v) => update("contact_email", v)} />
        <TextInput label="Contact Phone" value={data.contact_phone} onChange={(v) => update("contact_phone", v)} />
        <TextInput label="Music Genre" value={data.music_genre} onChange={(v) => update("music_genre", v)} placeholder="Hip-Hop, Afrobeats, Jazz…" />
        <TextInput label="Website" value={data.website} onChange={(v) => update("website", v)} />
        <TextInput label="YouTube Channel" value={data.youtube_channel} onChange={(v) => update("youtube_channel", v)} />
      </div>
      <div className="mt-4">
        <TextArea label="Artist Biography" value={data.bio} onChange={(v) => update("bio", v)} placeholder="Tell listeners about the artist…" rows={4} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <MediaUpload label="Artist Photograph" value={data.artist_photo_url} onChange={(v) => update("artist_photo_url", v)} />
        <MediaUpload label="Artist / Label Logo" value={data.logo_url} onChange={(v) => update("logo_url", v)} />
      </div>
    </div>
  );
}