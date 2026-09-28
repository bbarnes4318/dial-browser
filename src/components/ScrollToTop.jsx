import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const getHashId = (hash) => {
  const rawId = hash.slice(1);
  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (navigationType === "POP") return;

    // Only scroll to top when the PATH changes — not when only the hash changes.
    // This prevents unexpected scroll resets if the hash is added/removed.
    const pathChanged = prevPath.current !== pathname;
    prevPath.current = pathname;

    if (hash) {
      const id = getHashId(hash);
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return () => window.clearTimeout(timer);
    }

    if (pathChanged) {
      window.scrollTo(0, 0);
    }

  }, [pathname, hash, navigationType]);

  return null;
}