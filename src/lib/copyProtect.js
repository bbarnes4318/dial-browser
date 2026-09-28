// Lightweight client-side copyright / content protection.
//
// Raises the bar against casual copying of the app's content and images:
// disables the right-click context menu, text/image selection + dragging,
// copy/cut, and the common devtools / view-source / save-page shortcuts.
//
// This is deterrent-level only — a determined user can still inspect network
// traffic or the page source. It does not replace server-side access control
// or DRM; it simply makes grabbing text and images noticeably harder.
export function initCopyProtection() {
  if (typeof window === "undefined") return;

  // Block the right-click context menu site-wide.
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    return false;
  });

  // Block copying / cutting selected content.
  ["copy", "cut"].forEach((ev) =>
    window.addEventListener(ev, (e) => {
      e.preventDefault();
      return false;
    })
  );

  // Block dragging images / video / audio out of the page.
  window.addEventListener("dragstart", (e) => {
    const tag = e.target && e.target.tagName;
    if (tag === "IMG" || tag === "VIDEO" || tag === "AUDIO") {
      e.preventDefault();
      return false;
    }
  });

  // Force all media elements non-draggable (also catches React-rendered DOM).
  const lockMedia = () => {
    try {
      document.querySelectorAll("img, video, audio").forEach((el) => {
        el.setAttribute("draggable", "false");
        el.style["-webkit-user-drag"] = "none";
      });
    } catch { /* ignore */ }
  };
  if (document.readyState !== "loading") lockMedia();
  else document.addEventListener("DOMContentLoaded", lockMedia);
  const obs = new MutationObserver(lockMedia);
  const startObs = () => document.body && obs.observe(document.body, { childList: true, subtree: true });
  if (document.body) startObs();
  else document.addEventListener("DOMContentLoaded", startObs);

  // Block common devtools / view-source / save shortcuts (deterrent only).
  window.addEventListener("keydown", (e) => {
    const k = (e.key || "").toUpperCase();
    if (e.key === "F12") { e.preventDefault(); return false; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "J", "C"].includes(k)) {
      e.preventDefault();
      return false;
    }
    if ((e.ctrlKey || e.metaKey) && ["U", "S"].includes(k)) {
      e.preventDefault();
      return false;
    }
  });
}