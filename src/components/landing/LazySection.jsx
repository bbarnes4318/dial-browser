import React, { useState, useEffect, useRef, Suspense } from "react";

/**
 * Defers mounting of heavy below-the-fold sections until they are
 * about to enter the viewport. Combines with React.lazy for both
 * deferred mounting AND code-splitting — the biggest perf win for
 * long scroll pages.
 */
export default function LazySection({ children, rootMargin = "600px 0px", minHeight = "400px" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  if (visible) {
    return (
      <Suspense fallback={<div style={{ minHeight }} />}>
        {children}
      </Suspense>
    );
  }

  return <div ref={ref} style={{ minHeight }} aria-hidden="true" />;
}