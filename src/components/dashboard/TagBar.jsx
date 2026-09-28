import React, { useState, useMemo } from "react";
import { Tag, X, Plus, Check } from "lucide-react";

const SUGGESTED_TAGS = ["Important", "Medical", "Legal", "Travel", "Finance", "Work", "Personal", "Follow-up", "Urgent"];

export default function TagBar({ items, selectedTags, onTagToggle, onClearTags }) {
  const allTags = useMemo(() => {
    const tagSet = new Set();
    (items || []).forEach((item) => {
      (item.tags || []).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [items]);

  if (allTags.length === 0 && selectedTags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4">
      <span className="flex items-center gap-1 font-mono text-[9px] tracking-widest mr-1" style={{ color: "#8A8F98" }}>
        <Tag size={10} /> TAGS:
      </span>
      {allTags.map((tag) => {
        const active = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => onTagToggle(tag)}
            className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
            style={{
              background: active ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.6)",
              border: `0.5px solid ${active ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
              color: active ? "#D1FF26" : "#8A8F98",
            }}
          >
            {tag}
          </button>
        );
      })}
      {selectedTags.length > 0 && (
        <button
          onClick={onClearTags}
          className="flex items-center gap-1 px-2 py-1 font-mono text-[9px] tracking-widest uppercase transition-all"
          style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}
        >
          <X size={10} /> Clear
        </button>
      )}
    </div>
  );
}

export function TagDisplay({ tags, onRemove }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 font-mono text-[8px] tracking-widest px-1.5 py-0.5"
          style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}
        >
          {tag}
          {onRemove && (
            <button onClick={() => onRemove(tag)} className="hover:text-[#ef4444] transition-colors">
              <X size={8} />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

export function TagEditor({ tags = [], onSave, entityType }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [currentTags, setCurrentTags] = useState(tags);

  const addTag = (tag) => {
    const clean = tag.trim();
    if (!clean || currentTags.includes(clean)) return;
    const updated = [...currentTags, clean];
    setCurrentTags(updated);
    onSave(updated);
  };

  const removeTag = (tag) => {
    const updated = currentTags.filter((t) => t !== tag);
    setCurrentTags(updated);
    onSave(updated);
  };

  const availableSuggestions = SUGGESTED_TAGS.filter((t) => !currentTags.includes(t));

  return (
    <div className="relative">
      {editing ? (
        <div className="flex flex-wrap items-center gap-1.5 p-2" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          {currentTags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 font-mono text-[8px] tracking-widest px-1.5 py-0.5"
              style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26" }}
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-[#ef4444] transition-colors">
                <X size={8} />
              </button>
            </span>
          ))}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                e.preventDefault();
                addTag(input);
                setInput("");
              }
            }}
            placeholder="Add tag…"
            autoFocus
            className="flex-1 min-w-[80px] bg-transparent text-[10px] outline-none font-mono"
            style={{ color: "#F5F5F7" }}
          />
          {availableSuggestions.length > 0 && (
            <div className="w-full flex flex-wrap gap-1 mt-1 pt-1" style={{ borderTop: "0.5px solid rgba(209,255,38,0.1)" }}>
              {availableSuggestions.slice(0, 5).map((s) => (
                <button
                  key={s}
                  onClick={() => addTag(s)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-[8px] tracking-widest uppercase transition-all"
                  style={{ border: "0.5px solid rgba(138,143,152,0.15)", color: "#8A8F98" }}
                >
                  <Plus size={7} /> {s}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setEditing(false)} className="p-0.5" style={{ color: "#8A8F98" }}>
            <Check size={11} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 px-1.5 py-1 font-mono text-[8px] tracking-widest uppercase transition-all"
          style={{ border: "0.5px solid rgba(138,143,152,0.15)", color: "#8A8F98" }}
          title="Edit tags"
        >
          <Tag size={9} /> {currentTags.length > 0 ? `${currentTags.length}` : "Tag"}
        </button>
      )}
    </div>
  );
}