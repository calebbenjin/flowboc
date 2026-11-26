import { Lock } from "lucide-react";
import { siteMarkets } from "@/lib/site";

// Exact while small, then rounded down to the nearest 10 so the figure
// doesn't look oddly precise. Always the real count of onboarded instructors.
function formatInstructorCount(count: number) {
  return count < 50 ? String(count) : `${Math.floor(count / 10) * 10}+`;
}

export function TrustStrip({ instructorCount }: { instructorCount: number }) {
  return (
    <div className="mx-auto flex w-full max-w-[1230px] flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 pt-8 text-xs text-[#716277] sm:px-8">
      <span className="flex items-center gap-1.5">
        <Lock className="size-3.5 text-[#6e8060]" />
        Payments secured by Paystack
      </span>
      <span>Live in {siteMarkets.map((m) => m.country).join(", ")}</span>
      {instructorCount > 0 ? (
        <span>
          {formatInstructorCount(instructorCount)} instructor{instructorCount === 1 ? "" : "s"}{" "}
          teaching on Flowboc
        </span>
      ) : null}
    </div>
  );
}
