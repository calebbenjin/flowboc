"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { ArrowUpRight, Gift, Landmark, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useInstructor } from "@/components/InstructorProvider";
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
import { currencies, socialPlatforms } from "@/lib/demo";
import { siteHost } from "@/lib/site";
import type { CurrencyCode, SocialPlatform } from "@/generated/prisma/enums";
import { deleteAccount, updatePhoto, updateProfile, updateSocials } from "./actions";

export function ProfileClient() {
  const router = useRouter();
  const instructor = useInstructor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickLinks = [
    {
      href: "/dashboard/referrals",
      icon: Gift,
      title: "Referral Program",
      body: `Earn ${instructor.commissionRate}% commission on every subscription you refer.`,
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

  const [profilePending, setProfilePending] = useState(false);
  const [socialsPending, setSocialsPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [photoPending, setPhotoPending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function handleProfileSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setProfilePending(true);
    try {
      const result = await updateProfile({
        name: String(formData.get("name") ?? ""),
        location: String(formData.get("location") ?? ""),
        bio: String(formData.get("bio") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        currency: String(formData.get("currency") ?? "NGN") as CurrencyCode,
        slug: String(formData.get("slug") ?? ""),
        consultationLink: String(formData.get("consultationLink") ?? ""),
      });
      if (result.ok) {
        toast.success("Profile updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setProfilePending(false);
    }
  }

  async function handleSocialsSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const handles: Partial<Record<SocialPlatform, string>> = {};
    for (const p of socialPlatforms) {
      const platform = p.platform.toUpperCase() as SocialPlatform;
      handles[platform] = String(formData.get(`social-${p.platform}`) ?? "");
    }

    setSocialsPending(true);
    try {
      const result = await updateSocials(handles);
      if (result.ok) {
        toast.success("Socials updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSocialsPending(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPhotoPending(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      const result = await updatePhoto(blob.url);
      if (result.ok) {
        toast.success("Photo updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Couldn't upload photo. Please try again.");
    } finally {
      setPhotoPending(false);
    }
  }

  async function handleDelete() {
    setDeletePending(true);
    try {
      const result = await deleteAccount();
      if (!result.ok) {
        toast.error(result.error);
        setDeletePending(false);
        return;
      }
      // The JWT session cookie stays valid until it's explicitly cleared, so
      // sign out immediately rather than navigating anywhere that would
      // re-query the now-deleted account.
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeletePending(false);
    }
  }

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
          {instructor.photoUrl ? (
            <img
              src={instructor.photoUrl}
              alt={instructor.name}
              loading="lazy"
              width={800}
              height={800}
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <div className="grid size-20 shrink-0 place-items-center rounded-full bg-clay/12 text-lg font-medium text-clay">
              {instructor.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
          )}
          <div className="flex-1">
            <p className="font-medium">{instructor.name}</p>
            <p className="text-sm text-muted-foreground">
              {siteHost}/{instructor.slug}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void handlePhotoChange(e)}
            />
            <Button
              variant="quiet"
              size="sm"
              disabled={photoPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPending ? <Loader2 className="size-4 animate-spin" /> : "Change photo"}
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/${instructor.slug}`}>View page</Link>
            </Button>
          </div>
        </div>

        <form className="surface mt-6 space-y-4 p-6" onSubmit={handleProfileSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="n">Display name</Label>
              <Input id="n" name="name" defaultValue={instructor.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="l">Location</Label>
              <Input id="l" name="location" defaultValue={instructor.location ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="b">Bio</Label>
            <Textarea id="b" name="bio" rows={3} defaultValue={instructor.bio ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="e">Email</Label>
              <Input id="e" name="email" defaultValue={instructor.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p">Phone</Label>
              <Input id="p" name="phone" defaultValue={instructor.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c">Currency</Label>
              <select
                id="c"
                name="currency"
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
              <span className="text-sm text-muted-foreground">{siteHost}/</span>
              <Input id="s" name="slug" defaultValue={instructor.slug} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="consult">Consultation booking link</Label>
            <Input
              id="consult"
              name="consultationLink"
              defaultValue={instructor.consultationLink ?? ""}
              placeholder="https://calendly.com/you/consultation"
            />
            <p className="text-xs text-muted-foreground">
              Shown as a &quot;Book a consultation&quot; button on your public page. Paste a
              Calendly, Cal.com or other scheduling link.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="clay" disabled={profilePending}>
              {profilePending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>

        <form className="surface mt-6 space-y-4 p-6" onSubmit={handleSocialsSubmit}>
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
                  name={`social-${p.platform}`}
                  placeholder={p.placeholder}
                  defaultValue={
                    instructor.socials.find((s) => s.platform === p.platform.toUpperCase())
                      ?.handle ?? ""
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="clay" disabled={socialsPending}>
              {socialsPending ? (
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
              disabled={confirmText !== "DELETE" || deletePending}
              onClick={() => void handleDelete()}
            >
              {deletePending ? (
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
