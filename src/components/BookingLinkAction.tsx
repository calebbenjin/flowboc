"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstructor } from "@/components/InstructorProvider";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

export function BookingLinkAction({ className }: { className?: string }) {
  const instructor = useInstructor();
  const [copied, setCopied] = useState(false);
  const bookingUrl = `${siteUrl}/${instructor.slug}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success("Booking link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Button asChild variant="clay">
        <Link href={`/${instructor.slug}`} target="_blank" rel="noopener noreferrer">
          View your booking page <ExternalLink className="size-4" />
        </Link>
      </Button>
      <Button
        variant="quiet"
        size="icon"
        onClick={handleCopy}
        aria-label="Copy booking link"
        title="Copy booking link"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </Button>
    </div>
  );
}
