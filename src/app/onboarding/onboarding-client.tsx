"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { currencies, instructor, payoutProviderForCurrency, payoutProviderInfo } from "@/lib/demo";
import { useMockAction } from "@/hooks/use-mock-action";

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

export function OnboardingClient() {
  const [step, setStep] = useState<Step>("profile");
  const [slug, setSlug] = useState(instructor.slug);
  const [currency, setCurrency] = useState(instructor.currency);
  const [picked, setPicked] = useState<string[]>(["Vinyasa", "Yin"]);
  const [payoutConnected, setPayoutConnected] = useState(false);
  const profileAction = useMockAction();
  const payoutAction = useMockAction();

  const provider = payoutProviderForCurrency(currency);
  const providerInfo = payoutProviderInfo[provider];

  return (
    <div className="min-h-screen bg-sand/60 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="flex justify-center font-extrabold text-foreground text-2xl">
          flowbuk
        </Link>

        {step === "done" ? (
          <div className="surface mt-8 p-10 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/15">
              <Check className="size-6 text-success" />
            </div>
            <h1 className="mt-5 text-2xl">Your booking page is ready</h1>
            <p className="mt-2 text-sm text-muted-foreground">flowbuk.com/{slug}</p>
            {payoutConnected ? (
              <p className="mt-4 text-muted-foreground">Create your first class.</p>
            ) : (
              <p className="mt-4 text-muted-foreground">
                Create your first class. You can{" "}
                <Link href="/dashboard/payouts" className="text-clay hover:underline">
                  connect a payout account
                </Link>{" "}
                anytime before your first booking.
              </p>
            )}
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
                  Flowbuk never sees or stores your bank details. Class payments settle directly to
                  your account.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Badge variant="secondary">Step 2 of 2</Badge>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setPayoutConnected(false);
                    setStep("done");
                  }}
                >
                  I&apos;ll do this later
                </Button>
                <Button
                  type="button"
                  variant="clay"
                  size="lg"
                  disabled={payoutAction.pending}
                  onClick={() =>
                    payoutAction.run({
                      success: `Connected to ${providerInfo.name}`,
                      onDone: () => {
                        setPayoutConnected(true);
                        setStep("done");
                      },
                    })
                  }
                >
                  {payoutAction.pending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Connecting…
                    </>
                  ) : (
                    `Connect with ${providerInfo.name}`
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form
            className="surface mt-8 space-y-6 p-8"
            onSubmit={(e) => {
              e.preventDefault();
              profileAction.run({ success: "Profile saved", onDone: () => setStep("payout") });
            }}
          >
            <div>
              <h1 className="text-2xl">Set up your profile</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                This is what students see on your booking page.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pname">Display name</Label>
                <Input id="pname" defaultValue={instructor.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc">Location</Label>
                <Input id="loc" defaultValue={instructor.location} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={3} defaultValue={instructor.bio} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" defaultValue={instructor.phone} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ig">Instagram</Label>
                <Input
                  id="ig"
                  defaultValue={instructor.socials.find((s) => s.platform === "instagram")?.handle}
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
                  <span className="text-sm text-muted-foreground">flowbuk.com/</span>
                  <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cur">Currency</Label>
                <select
                  id="cur"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as typeof currency)}
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
                <Button type="button" variant="ghost" asChild>
                  <Link href="/dashboard">Skip for now</Link>
                </Button>
                <Button type="submit" variant="clay" size="lg" disabled={profileAction.pending}>
                  {profileAction.pending ? (
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
