import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Arch backdrop for the landing page's phone demos: a filled arch with an
// offset outline arch, a soft blob, a dot grid and a small accent dot. Each
// section passes its own tones so the arch stands out on its background;
// `mirrored` flips the blob/dots/accent to the other side.
export type ArchTones = {
  /** Tailwind gradient stops for the filled arch, e.g. "from-[#ddd8ff] to-[#c4bbff]". */
  arch: string;
  /** Border colour class for the outline arch. */
  outline: string;
  /** Text colour class for the blob (it's filled with currentColor). */
  blob: string;
  /** Dot colour for the dot grid, as a CSS colour. */
  dots: string;
  /** Background class for the accent dot. */
  accent: string;
};

export function PhoneArch({
  tones,
  mirrored = false,
  children,
}: {
  tones: ArchTones;
  mirrored?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate mx-auto flex w-full max-w-[520px] justify-center py-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <svg
          viewBox="0 0 200 200"
          className={cn(
            "absolute top-[2%] w-[58%]",
            mirrored ? "left-[-4%] -scale-x-100" : "right-[-4%]",
            tones.blob,
          )}
        >
          <path
            fill="currentColor"
            d="M43.6,-58.9C55.4,-49.5,63.3,-35.4,68.2,-19.9C73.1,-4.4,75,12.5,69.1,26.2C63.1,39.9,49.3,50.4,34.4,58.5C19.5,66.6,3.6,72.2,-13.2,71.4C-30,70.6,-47.7,63.4,-58.6,50.4C-69.5,37.4,-73.6,18.7,-72.5,1C-71.4,-16.7,-65.1,-33.4,-53.6,-43.2C-42.1,-53,-25.4,-55.9,-9.4,-57.7C6.6,-59.5,31.8,-68.3,43.6,-58.9Z"
            transform="translate(100 100)"
          />
        </svg>
        <span
          className={cn(
            "absolute bottom-[3%] left-1/2 h-[84%] w-[96%] rounded-t-full border-2 border-b-0",
            mirrored ? "translate-x-[-53%]" : "translate-x-[-47%]",
            tones.outline,
          )}
        />
        <span
          className={cn(
            "absolute bottom-[6%] left-1/2 h-[78%] w-[88%] -translate-x-1/2 rounded-t-full bg-linear-to-b",
            tones.arch,
          )}
        />
        <span
          className={cn(
            "absolute top-[18%] h-24 w-20 bg-size-[12px_12px]",
            mirrored ? "right-[4%]" : "left-[4%]",
          )}
          style={{ backgroundImage: `radial-gradient(${tones.dots} 1.5px, transparent 1.5px)` }}
        />
        <span
          className={cn(
            "absolute bottom-[4%] size-16 rounded-full sm:size-20",
            mirrored ? "right-[12%]" : "left-[12%]",
            tones.accent,
          )}
        />
      </div>

      {/* The demo is shared across sections, so it's shrunk here with zoom
          rather than by changing its own sizes. */}
      <div className="relative min-w-0 [zoom:0.84]">{children}</div>
    </div>
  );
}
