import React from "react";
import { Switch } from "@/components/ui/switch";
import { TextInput, TextArea, StepHeader } from "../Field";
import MediaUpload from "../MediaUpload";

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-3" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
      <div>
        <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#F5F5F7" }}>{label}</p>
        <p className="text-[11px]" style={{ color: "#8A8F98" }}>{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function StepUploadMusic({ data, update }) {
  return (
    <div>
      <StepHeader step="02" title="Upload Your Music" subtitle="Select the release you want to distribute." />
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="Song Title" value={data.song_title} onChange={(v) => update("song_title", v)} />
        <TextInput label="Album / EP Name" value={data.album_name} onChange={(v) => update("album_name", v)} />
        <TextInput label="Release Date" type="date" value={data.release_date} onChange={(v) => update("release_date", v)} />
        <TextInput label="ISRC (if applicable)" value={data.isrc} onChange={(v) => update("isrc", v)} />
        <TextInput label="Producer Information" value={data.producer_info} onChange={(v) => update("producer_info", v)} />
        <TextInput label="Songwriter Information" value={data.songwriter_info} onChange={(v) => update("songwriter_info", v)} />
      </div>
      <div className="mt-4">
        <TextArea label="Copyright Information" value={data.copyright_info} onChange={(v) => update("copyright_info", v)} rows={2} />
      </div>
      <div className="mt-4">
        <ToggleRow label="Explicit Content" desc="Mark if the release contains explicit material" checked={!!data.explicit_content} onChange={(v) => update("explicit_content", v)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <MediaUpload label="Cover Artwork" value={data.cover_artwork_url} onChange={(v) => update("cover_artwork_url", v)} />
        <MediaUpload label="Music File (MP3 / WAV)" value={data.music_file_url} onChange={(v) => update("music_file_url", v)} accept="audio/*" />
      </div>
      <div className="mt-4">
        <TextInput label="Music Video URL (YouTube)" value={data.music_video_url} onChange={(v) => update("music_video_url", v)} placeholder="https://youtube.com/…" />
      </div>
    </div>
  );
}