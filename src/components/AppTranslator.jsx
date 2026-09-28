import React, { useEffect, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { translateBatch } from "@/lib/clientTranslate";

// App-wide automatic translation layer.
// Translates every visible text node (plus placeholder / aria-label / title
// attributes) to the selected language, persists translations per language in
// localStorage (one-time per string), restores English when set back, and
// re-translates new content (lazy sections, modals) via a MutationObserver.
// Uses free no-key endpoints — no platform credits consumed.

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "NOSCRIPT", "CODE", "PRE", "KBD", "SAMP"]);
const TR_ATTRS = ["placeholder", "aria-label", "title"];
const CACHE_VERSION = "v2";

function cacheKey(lang) { return `trCache:${CACHE_VERSION}:${lang}`; }
function loadCache(lang) {
  try { return JSON.parse(localStorage.getItem(cacheKey(lang)) || "{}") || {}; } catch { return {}; }
}
function saveCache(lang, cache) {
  try { localStorage.setItem(cacheKey(lang), JSON.stringify(cache)); } catch {}
}
function ws(s) { return { lead: s.match(/^\s*/)[0], trail: s.match(/\s*$/)[0] }; }
function hasLetters(s) { return /[a-zA-Z\u00C0-\u024F]/.test(s); }

function collectText(root) {
  const nodes = [];
  if (!root) return nodes;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || node.nodeValue.trim().length < 2) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if (!p || SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (p.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  return nodes;
}

function collectAttrs(root) {
  const els = [];
  if (!root || !root.querySelectorAll) return els;
  const all = root.querySelectorAll(TR_ATTRS.map((a) => `[${a}]`).join(","));
  all.forEach((el) => {
    if (el.closest("[data-no-translate]")) return;
    TR_ATTRS.forEach((attr) => {
      const v = el.getAttribute(attr);
      if (v && v.trim().length >= 2 && hasLetters(v)) els.push({ el, attr });
    });
  });
  return els;
}

function restoreAll() {
  collectText(document.body).forEach((node) => {
    if (node._trOriginal !== undefined) {
      node.nodeValue = node._trOriginal;
      delete node._trOriginal;
      delete node._trTranslated;
    }
  });
  collectAttrs(document.body).forEach(({ el, attr }) => {
    const orig = el.getAttribute(`data-tr-orig-${attr}`);
    if (orig !== null) {
      el.setAttribute(attr, orig);
      el.removeAttribute(`data-tr-orig-${attr}`);
      el.removeAttribute(`data-tr-done-${attr}`);
    }
  });
}

export default function AppTranslator() {
  const { lang, isRTL } = useLanguage();
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [isRTL, lang]);

  useEffect(() => {
    if (lang === "en") { restoreAll(); return; }
    let cancelled = false;
    let timer = null;
    const cache = loadCache(lang);

    const applyText = (entry, tr) => {
      const { lead, trail } = ws(entry.source);
      entry.nodes.forEach((node) => {
        if (node._trOriginal === undefined) node._trOriginal = node.nodeValue;
        node.nodeValue = lead + tr + trail;
        node._trTranslated = lang;
      });
    };
    const applyAttr = (entry, tr) => {
      entry.els.forEach(({ el, attr }) => {
        if (!el.getAttribute(`data-tr-orig-${attr}`)) el.setAttribute(`data-tr-orig-${attr}`, entry.source);
        el.setAttribute(attr, tr);
        el.setAttribute(`data-tr-done-${attr}`, lang);
      });
    };
    const applyEntry = (entry, tr) => {
      if (entry.nodes.length) applyText(entry, tr);
      if (entry.els.length) applyAttr(entry, tr);
    };

    const run = async () => {
      const byKey = new Map();
      const upsert = (key, source, kind, target) => {
        if (!byKey.has(key)) byKey.set(key, { source, nodes: [], els: [] });
        byKey.get(key)[kind].push(target);
      };

      collectText(document.body).forEach((node) => {
        if (node._trTranslated === lang) return;
        const source = node._trOriginal !== undefined ? node._trOriginal : node.nodeValue;
        const key = source.trim();
        if (!key || !hasLetters(key)) {
          if (node._trOriginal === undefined) node._trOriginal = node.nodeValue;
          node._trTranslated = lang;
          return;
        }
        upsert(key, source, "nodes", node);
      });

      collectAttrs(document.body).forEach(({ el, attr }) => {
        if (el.getAttribute(`data-tr-done-${attr}`) === lang) return;
        const v = el.getAttribute(attr);
        upsert(v.trim(), v, "els", { el, attr });
      });

      if (!byKey.size) return;
      const toFetch = [];
      byKey.forEach((entry, key) => {
        if (cache[key] !== undefined) applyEntry(entry, cache[key]);
        else toFetch.push(key);
      });
      if (!toFetch.length) return;

      const BATCH = 40;
      for (let i = 0; i < toFetch.length && !cancelled; i += BATCH) {
        const batch = toFetch.slice(i, i + BATCH);
        try {
          const trs = await translateBatch(batch, lang);
          batch.forEach((key, idx) => {
            const tr = trs[idx];
            const entry = byKey.get(key);
            if (tr == null || !tr.trim()) return;                    // failure — leave for retry
            // Success (translation may equal source for proper nouns/short tier
            // names like "Premium" — apply & cache so it's marked done, not retried forever).
            cache[key] = tr;
            applyEntry(entry, tr);
          });
          saveCache(lang, cache);
        } catch (e) { console.error("translation batch failed:", e); }
      }
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { timer = null; run(); }, 250);
    };

    schedule();
    // delayed passes catch slow/lazy content (below-the-fold sections, modals)
    setTimeout(() => { if (!cancelled && langRef.current === lang) run(); }, 1500);
    setTimeout(() => { if (!cancelled && langRef.current === lang) run(); }, 5000);
    const obs = new MutationObserver(() => { if (langRef.current !== "en") schedule(); });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => { cancelled = true; if (timer) clearTimeout(timer); obs.disconnect(); };
  }, [lang]);

  return null;
}