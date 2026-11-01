"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flower2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useInstructor } from "@/components/InstructorProvider";
import { Button } from "@/components/ui/button";
import { canUseProDesign } from "@/lib/public-page-theme";
import { ONBOARDING_MOODS, type OnboardingMood } from "@/lib/onboarding-appearance";
import { updateDesign } from "../design/actions";

export function OnboardingDesignOffer({ initialMood }: { initialMood: OnboardingMood | null }) {
  const instructor = useInstructor();
  const router = useRouter();
  const [mood, setMood] = useState(initialMood);
  const [pending, setPending] = useState(false);
  const storageKey = `flowboc:onboarding-mood:${instructor.id}`;
  const entitled = canUseProDesign(instructor);

  useEffect(() => {
    try {
      if (initialMood) sessionStorage.setItem(storageKey, initialMood);
      const saved = initialMood ?? sessionStorage.getItem(storageKey);
      if (saved && Object.hasOwn(ONBOARDING_MOODS, saved)) setMood(saved as OnboardingMood);
    } catch {
      /* The URL-supplied mood still works when browser storage is unavailable. */
    }
  }, [initialMood, storageKey]);

  if (!mood) return null;
  const palette = ONBOARDING_MOODS[mood];

  function dismiss() {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* Storage may be unavailable. */
    }
    setMood(null);
    // Remove the recommendation from the URL so a refresh doesn't restore a dismissed offer.
    router.replace("/dashboard/billing", { scroll: false });
  }

  async function apply() {
    setPending(true);
    try {
      const result = await updateDesign({
        pageTemplate: "SAGE",
        pageFont: "EDITORIAL",
        coverImageUrl: null,
        themeColor: palette.color,
        pageLayout: "CLASSIC",
        backgroundType: "COLOR",
        backgroundColor: palette.background,
        backgroundImageUrl: null,
        backgroundGradientFrom: null,
        backgroundGradientTo: null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      dismiss();
      toast.success("Your Pro look is ready.");
      router.refresh();
    } catch {
      toast.error("We couldn’t apply your design. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className="mt-6 rounded-2xl border border-[#e0d8ed] bg-[#f5f0ff] p-5 text-[#30293e]"
      aria-labelledby="pro-preview-offer"
    >
      <div className="flex items-start gap-3">
        <Flower2 className="mt-1 size-6 shrink-0 text-[#6355ff]" />
        <div>
          <h2 id="pro-preview-offer" className="text-lg">
            Your {palette.label.toLowerCase()} Pro preview
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#756782]">
            {entitled
              ? "Your plan supports this look. Apply the Sage layout and mood you explored during onboarding."
              : "Choose Pro below to unlock the Sage layout and mood colours. Your public page keeps its Starter design until you have Pro access and apply this look."}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#756782]">
            {entitled
              ? "This replaces your page’s template, font, cover, and background with the preview design."
              : "Your choice is remembered in this browser tab while you explore plans."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {entitled && (
              <Button onClick={() => void apply()} disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : "Apply my Pro look"}
              </Button>
            )}
            <Button variant="ghost" onClick={dismiss} disabled={pending}>
              {entitled ? "Keep my current design" : "Keep Starter for now"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
