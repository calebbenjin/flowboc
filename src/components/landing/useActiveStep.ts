"use client";

import * as React from "react";

// Drives the "which step/card is active" scrollytelling pattern used across
// the landing page's sticky sections (HowItWorks, TeachYourWay, GetStarted).
//
// On a large or near-instant scroll jump (a real fast trackpad flick, or a
// hash-link landing straight into the middle of a section), more than one
// observed ref can report isIntersecting in the same callback batch. Picking
// whichever is closest to the viewport's vertical center keeps `active`
// deterministic — naively calling setActive for every intersecting entry
// left it on whichever happened to be last in the batch, which doesn't
// necessarily match what's visually centered.
export function useActiveStep(count: number) {
  const [active, setActive] = React.useState(0);
  const refs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((entry) => entry.isIntersecting);
        if (intersecting.length === 0) return;

        const centerY = window.innerHeight / 2;
        const distanceFromCenter = (entry: IntersectionObserverEntry) =>
          Math.abs((entry.boundingClientRect.top + entry.boundingClientRect.bottom) / 2 - centerY);

        const closest = intersecting.reduce((best, entry) =>
          distanceFromCenter(entry) < distanceFromCenter(best) ? entry : best,
        );

        const idx = refs.current.findIndex((el) => el === closest.target);
        if (idx !== -1) setActive(idx);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );

    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [count]);

  return { active, refs };
}
