"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import posthog from "posthog-js";
import { toast } from "sonner";
import { Building2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PayoutConnectForm } from "@/components/PayoutConnectForm";
import { currencies, payoutProviderInfo } from "@/lib/demo";
import { payoutProviderForCurrency } from "@/lib/payout";
import { siteHost } from "@/lib/site";
import { checkSlugAvailable, completeOnboarding, saveProfile, skipOnboarding } from "./actions";
import type { CurrencyCode } from "@/generated/prisma/enums";

const specialties = [
  "Vinyasa",
  "Hatha",
  "Yin",
  "Ashtanga",
  "Restorative",
  "Breathwork",
  "Prenatal",
  "Beginners",
];

type Step = "profile" | "payout" | "done";

type Defaults = {
  name: string;
  location: string;
  bio: string;
  phone: string;
  instagram: string;
  specialties: string[];
  slug: string;
  currency: CurrencyCode;
};

export function OnboardingClient({ defaults }: { defaults: Defaults }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [slug, setSlug] = useState(defaults.slug);
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    message: string | null;
    ok: boolean;
  }>({ checking: false, message: null, ok: true });
  const [currency, setCurrency] = useState<CurrencyCode>(defaults.currency);
  const [picked, setPicked] = useState<string[]>(defaults.specialties);
  const [profilePending, setProfilePending] = useState(false);
  const [skipPending, setSkipPending] = useState(false);

  const provider = payoutProviderForCurrency(currency);
  const providerInfo = payoutProviderInfo[provider === "PAYSTACK" ? "paystack" : "stripe"];

  async function handleSlugBlur() {
    const trimmed = slug.trim().toLowerCase();
    if (!trimmed || trimmed === defaults.slug) {
      setSlugStatus({ checking: false, message: null, ok: true });
      return;
    }
    setSlugStatus({ checking: true, message: null, ok: true });
    const result = await checkSlugAvailable(trimmed);
    setSlugStatus({
      checking: false,
      ok: result.available,
      message: result.available ? "This link is available" : (result.reason ?? "Unavailable"),
    });
  }

  async function handleProfileSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setProfilePending(true);
    try {
      const result = await saveProfile({
        name: String(formData.get("name") ?? ""),
        location: String(formData.get("location") ?? ""),
        bio: String(formData.get("bio") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        instagramHandle: String(formData.get("instagram") ?? ""),
        specialties: picked,
        slug,
        currency,
      });
      if (result.ok) {
        toast.success("Profile saved");
        setStep("payout");
      } else {
        toast.error(result.error);
      }
    } finally {
      setProfilePending(false);
    }
  }

  async function finishOnboarding() {
    const result = await completeOnboarding();
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (
      process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
      process.env["NEXT_PUBLIC_POSTHOG_HOST"]
    ) {
      posthog.capture("onboarding_completed");
    }
    setStep("done");
  }

  async function handleSkip() {
    setSkipPending(true);
    try {
      const result = await skipOnboarding();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push("/dashboard");
    } finally {
      setSkipPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-sand/60 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="flex justify-center font-extrabold text-foreground text-2xl">
          flowboc
        </Link>

        {step === "done" ? (
          <div className="surface mt-8 p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/15">
              <Check className="size-6 text-success" />
            </div>
            <h1 className="mt-5 text-2xl">Your booking page is ready</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {siteHost}/{slug}
            </p>
            <p className="mt-4 text-muted-foreground">
              Create your first class. You can{" "}
              <Link href="/dashboard/payouts" className="text-clay hover:underline">
                connect a payout account
              </Link>{" "}
              anytime before your first booking.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild variant="clay" size="lg">
                <Link href="/dashboard/classes/new">Create first class</Link>
              </Button>
              <Button asChild variant="quiet" size="lg">
                <Link href={`/${slug}`}>View booking page</Link>
              </Button>
            </div>
          </div>
        ) : step === "payout" ? (
          <div className="surface mt-8 space-y-6 p-8">
            <div>
              <h1 className="text-2xl">Connect a payout account</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                So you can get paid directly for every class you teach.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 rounded-lg bg-sand/60 p-5 sm:flex-row sm:items-center">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-clay/12 text-clay">
                <Building2 className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium">
                  Based on your currency ({currency}), you&apos;ll connect through{" "}
                  {providerInfo.name}.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Flowboc sends your details directly to {providerInfo.name} to set up payouts — we
                  only keep the last 4 digits for your reference, never the full number.
                </p>
              </div>
            </div>

            {provider === "PAYSTACK" ? (
              <PayoutConnectForm
                currency={currency}
                connectLabel={`Connect with ${providerInfo.name}`}
                onConnected={() => void finishOnboarding()}
              />
            ) : (
              <p className="rounded-lg bg-sand/60 p-4 text-sm text-muted-foreground">
                Direct payouts for {currency} aren&apos;t available yet — you can connect one later
                from your dashboard once support lands.
              </p>
            )}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Badge variant="secondary">Step 2 of 2</Badge>
              <Button type="button" variant="ghost" onClick={() => void finishOnboarding()}>
                I&apos;ll do this later
              </Button>
            </div>
          </div>
        ) : (
          <form className="surface mt-8 space-y-6 p-8" onSubmit={handleProfileSubmit}>
            <div>
              <h1 className="text-2xl">Set up your profile</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                This is what students see on your booking page.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pname">Display name</Label>
                <Input id="pname" name="name" defaultValue={defaults.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc">Location</Label>
                <Input id="loc" name="location" defaultValue={defaults.location} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" name="bio" rows={3} defaultValue={defaults.bio} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={defaults.phone} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ig">Instagram</Label>
                <Input
                  id="ig"
                  name="instagram"
                  defaultValue={defaults.instagram}
                  placeholder="@yourhandle"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specialties</Label>
              <div className="flex flex-wrap gap-2">
                {specialties.map((s) => {
                  const on = picked.includes(s);
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setPicked(on ? picked.filter((p) => p !== s) : [...picked, s])}
                      className={
                        on
                          ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                          : "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slug">Booking page link</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{siteHost}/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    onBlur={() => void handleSlugBlur()}
                  />
                </div>
                {slugStatus.checking ? (
                  <p className="text-xs text-muted-foreground">Checking availability…</p>
                ) : slugStatus.message ? (
                  <p
                    className={slugStatus.ok ? "text-xs text-success" : "text-xs text-destructive"}
                  >
                    {slugStatus.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cur">Currency</Label>
                <select
                  id="cur"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code} — {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Badge variant="secondary">Step 1 of 2</Badge>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={skipPending}
                  onClick={() => void handleSkip()}
                >
                  Skip for now
                </Button>
                <Button
                  type="submit"
                  variant="clay"
                  size="lg"
                  disabled={profilePending || !slugStatus.ok}
                >
                  {profilePending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
