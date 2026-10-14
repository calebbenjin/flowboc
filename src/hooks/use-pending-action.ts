"use client";

import { useCallback, useRef, useState } from "react";

type Status = "idle" | "pending" | "slow" | "timeout";

type RunResult<T> =
  { outcome: "success"; value: T } | { outcome: "error"; error: unknown } | { outcome: "timeout" };

// Wraps a server-action call with slow-connection and timeout feedback. A
// server action can't actually be cancelled mid-flight — "timeout" just
// stops the UI from waiting on it so the user can retry, rather than
// leaving a spinner running forever on a dropped connection. A `generation`
// counter guards against the original call resolving late (after a timeout
// or a fresh retry) and clobbering newer state.
export function usePendingAction(opts?: { slowAfterMs?: number; timeoutAfterMs?: number }) {
  const slowAfterMs = opts?.slowAfterMs ?? 6000;
  const timeoutAfterMs = opts?.timeoutAfterMs ?? 25000;
  const [status, setStatus] = useState<Status>("idle");
  const generation = useRef(0);

  const run = useCallback(
    async <T>(fn: () => Promise<T>): Promise<RunResult<T>> => {
      const myGen = ++generation.current;
      setStatus("pending");

      const slowTimer = setTimeout(() => {
        if (generation.current === myGen) setStatus("slow");
      }, slowAfterMs);

      const timeoutPromise = new Promise<{ outcome: "timeout" }>((resolve) => {
        setTimeout(() => resolve({ outcome: "timeout" }), timeoutAfterMs);
      });

      try {
        const raced = await Promise.race([
          fn().then((value) => ({ outcome: "success" as const, value })),
          timeoutPromise,
        ]);
        clearTimeout(slowTimer);

        if (raced.outcome === "timeout") {
          if (generation.current === myGen) setStatus("timeout");
          return raced;
        }
        if (generation.current === myGen) setStatus("idle");
        return raced;
      } catch (error) {
        clearTimeout(slowTimer);
        if (generation.current === myGen) setStatus("idle");
        return { outcome: "error", error };
      }
    },
    [slowAfterMs, timeoutAfterMs],
  );

  return {
    status,
    isPending: status === "pending" || status === "slow",
    isSlow: status === "slow",
    isTimedOut: status === "timeout",
    run,
  };
}
