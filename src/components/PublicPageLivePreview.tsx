"use client";
import { useEffect, useRef, useState } from "react";
import type { ClassFormDraft } from "@/components/ClassForm";
import type { PublicDesignPreview } from "@/lib/public-preview";

export function PublicPageLivePreview({
  draft = null,
  design,
  thumbnail = false,
}: {
  draft?: ClassFormDraft | null;
  design?: PublicDesignPreview;
  thumbnail?: boolean;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef({ draft, design });
  latest.current = { draft, design };
  const [ready, setReady] = useState(false);
  function send(value: typeof latest.current) {
    frame.current?.contentWindow?.postMessage(
      { type: "flowboc:public-preview", ...value, mode: value.design ? "design" : "class" },
      window.location.origin,
    );
  }
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (
        event.origin === window.location.origin &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === "flowboc:public-preview-ready"
      ) {
        setReady(true);
        send(latest.current);
      }
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  useEffect(() => {
    if (ready) send({ draft, design });
  }, [draft, design, ready]);
  return (
    <div
      className={
        thumbnail
          ? "relative mx-auto h-[280px] w-[183px] overflow-hidden rounded-t-[1.2rem] border-[4px] border-[#483c54] bg-[#faf8f3]"
          : "mx-auto w-full max-w-[390px]"
      }
    >
      {!ready && !thumbnail && (
        <p role="status" className="mb-2 text-center text-xs text-muted-foreground">
          Loading your public page…
        </p>
      )}
      <div
        className={
          thumbnail
            ? "h-full w-full overflow-hidden"
            : "overflow-hidden rounded-[2rem] border-[7px] border-[#30293e] bg-[#faf8f3] shadow-lg"
        }
      >
        <iframe
          ref={frame}
          loading="lazy"
          title={
            thumbnail
              ? `${design?.pageTemplate === "SAGE" ? "Sage" : "Standard"} template preview`
              : "Live preview of your public booking page"
          }
          src="/dashboard/classes/preview"
          tabIndex={thumbnail ? -1 : 0}
          className={
            thumbnail
              ? "pointer-events-none block h-[900px] w-[390px] origin-top-left scale-[0.45] border-0"
              : "block h-[min(70dvh,700px)] min-h-[420px] w-full border-0"
          }
          onLoad={() => send(latest.current)}
        />
      </div>
      {!thumbnail && (
        <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
          Your public-page design, updated as you edit. Booking actions are disabled in preview.
        </p>
      )}
    </div>
  );
}
