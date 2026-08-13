"use client";

import { useState } from "react";
import { toast } from "sonner";

type RunOptions = {
  success: string;
  error?: string;
  delay?: number;
  onDone?: () => void;
};

export function useMockAction() {
  const [pending, setPending] = useState(false);

  async function run({ success, error, delay = 700, onDone }: RunOptions) {
    setPending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, delay));
      toast.success(success);
      onDone?.();
    } catch {
      toast.error(error ?? "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return { pending, run };
}
