"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Gift, Landmark, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { currencies, instructor, referralProgram, socialPlatforms } from "@/lib/demo";
import { useMockAction } from "@/hooks/use-mock-action";

const quickLinks = [
  {
    href: "/dashboard/referrals",
    icon: Gift,
    title: "Referral Program",
    body: `Earn ${referralProgram.commissionRate}% commission on every subscription you refer.`,
    cta: "View referrals",
  },
  {
    href: "/dashboard/payouts",
    icon: Landmark,
    title: "Payouts",
    body: "Connect a payout account to get paid directly for every class you teach.",
    cta: "Manage payouts",
  },
];

export function ProfileClient() {
  const router = useRouter();
  const profileAction = useMockAction();
  const socialsAction = useMockAction();
  const deleteAction = useMockAction();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  return (
    <DashboardShell>
      <div className="max-w-3xl">
        <h1 className="text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">This is your public booking page.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {quickLinks.map((l) => (
            <div key={l.href} className="surface flex flex-col gap-4 p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-clay/12 text-clay">
                <l.icon className="size-5" />
              </span>
              <div className="flex-1">
                <p className="font-medium">{l.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{l.body}</p>
              </div>
              <Button asChild variant="quiet" size="sm" className="self-start">
                <Link href={l.href}>
                  {l.cta} <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="surface mt-6 flex flex-wrap items-center gap-5 p-6">
          <img
            src={instructor.photo}
            alt={instructor.name}
            loading="lazy"
            width={800}
            height={800}
            className="size-20 rounded-full object-cover"
          />
          <div className="flex-1">
            <p className="font-medium">{instructor.name}</p>
            <p className="text-sm text-muted-foreground">flowbuk.com/{instructor.slug}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="quiet" size="sm">
              Change photo
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/${instructor.slug}`}>View page</Link>
            </Button>
          </div>
        </div>

        <form
          className="surface mt-6 space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            profileAction.run({ success: "Profile updated" });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="n">Display name</Label>
              <Input id="n" defaultValue={instructor.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="l">Location</Label>
              <Input id="l" defaultValue={instructor.location} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="b">Bio</Label>
            <Textarea id="b" rows={3} defaultValue={instructor.bio} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="e">Email</Label>
              <Input id="e" defaultValue={instructor.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p">Phone</Label>
              <Input id="p" defaultValue={instructor.phone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c">Currency</Label>
              <select
                id="c"
                defaultValue={instructor.currency}
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
          <div className="space-y-2">
            <Label htmlFor="s">Booking link</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">flowbuk.com/</span>
              <Input id="s" defaultValue={instructor.slug} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="consult">Consultation booking link</Label>
            <Input
              id="consult"
              defaultValue={instructor.consultationLink}
              placeholder="https://calendly.com/you/consultation"
            />
            <p className="text-xs text-muted-foreground">
              Shown as a &quot;Book a consultation&quot; button on your public page. Paste a
              Calendly, Cal.com or other scheduling link.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="clay" disabled={profileAction.pending}>
              {profileAction.pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>

        <form
          className="surface mt-6 space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            socialsAction.run({ success: "Socials updated" });
          }}
        >
          <div>
            <h2 className="text-sm font-medium">Socials</h2>
            <p className="text-xs text-muted-foreground">
              Shown as icon links on your public page. Leave any blank to hide them.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {socialPlatforms.map((p) => (
              <div key={p.platform} className="space-y-2">
                <Label htmlFor={`social-${p.platform}`}>{p.label}</Label>
                <Input
                  id={`social-${p.platform}`}
                  placeholder={p.placeholder}
                  defaultValue={instructor.socials.find((s) => s.platform === p.platform)?.handle}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="clay" disabled={socialsAction.pending}>
              {socialsAction.pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>

        <div className="surface mt-6 space-y-3 p-6">
          <div>
            <h2 className="text-sm font-medium text-destructive">Danger zone</h2>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account, booking page and class history. This can&apos;t be
              undone.
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete account
          </Button>
        </div>
      </div>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setConfirmText("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your profile, booking page, classes and student history.
              Students who&apos;ve booked with you won&apos;t be able to find your page anymore.
              This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type <span className="font-medium">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== "DELETE" || deleteAction.pending}
              onClick={() =>
                deleteAction.run({
                  success: "Account deleted",
                  onDone: () => router.push("/"),
                })
              }
            >
              {deleteAction.pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Deleting…
                </>
              ) : (
                "Delete account"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
