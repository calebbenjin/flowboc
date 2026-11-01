"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import posthog from "posthog-js";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";
import {
  ArrowUpRight,
  HeartHandshake,
  Landmark,
  Loader2,
  Flower2,
  Camera,
  Leaf,
  Link2,
} from "lucide-react";
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
import { currencies, socialPlatforms, timezones } from "@/lib/demo";
import styles from "./profile.module.css";
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
      icon: HeartHandshake,
      title: "Grow your teaching circle",
      body: `Earn a ${instructor.commissionRate}% one-time bonus for every instructor you refer who subscribes.`,
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
        timezone: String(formData.get("timezone") ?? instructor.timezone),
        slug: String(formData.get("slug") ?? ""),
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
      const compressed = await compressImage(file, { maxDimension: 1000 });
      const blob = await upload(compressed.name, compressed, {
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
      if (
        process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
        process.env["NEXT_PUBLIC_POSTHOG_HOST"]
      ) {
        posthog.reset();
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeletePending(false);
    }
  }

  return (
    <DashboardShell>
      <div className={styles["page"]}>
        <header className={styles["header"]}>
          <div>
            <p className={styles["eyebrow"]}>The teacher behind the practice</p>
            <h1>Profile</h1>
          </div>
          <Link href={`/${instructor.slug}`}>
            View public page <ArrowUpRight size={16} />
          </Link>
        </header>

        <div className={styles["identity"]}>
          {instructor.photoUrl ? (
            <img
              src={instructor.photoUrl}
              alt={instructor.name}
              loading="lazy"
              width={800}
              height={800}
              className={styles["photo"]}
            />
          ) : (
            <div className={styles["initials"]}>
              {instructor.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
          )}
          <div className={styles["identityCopy"]}>
            <span className={styles["teacherLabel"]}>
              <Flower2 size={14} /> Your public presence
            </span>
            <h2>{instructor.name}</h2>
            <p className="text-sm text-muted-foreground">
              {siteHost}/{instructor.slug}
            </p>
          </div>
          <div className={styles["photoActions"]}>
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
              {photoPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Camera size={15} /> Change photo
                </>
              )}
            </Button>
          </div>
        </div>

        <nav className={styles["sectionNav"]} aria-label="Profile sections">
          <a href="#your-story">Your story</a>
          <a href="#contact-details">Contact & preferences</a>
          <a href="#social-links">Social links</a>
        </nav>
        <form className={styles["form"]} onSubmit={handleProfileSubmit}>
          <div id="your-story" className={styles["sectionHeading"]}>
            <span>
              <Leaf size={21} strokeWidth={1.4} />
            </span>
            <div>
              <h2>A little about you</h2>
              <p>Help students get to know the person guiding their practice.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="n">Display name</Label>
              <Input id="n" name="name" defaultValue={instructor.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-timezone">Your timezone</Label>
              <select
                id="profile-timezone"
                name="timezone"
                defaultValue={instructor.timezone}
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                {!timezones.some((zone) => zone.value === instructor.timezone) ? (
                  <option value={instructor.timezone}>{instructor.timezone}</option>
                ) : null}
                {timezones.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.city} — {zone.value}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Used for your dashboard, calendar, monthly totals, and new classes. Existing classes
                keep their own timezone.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="l">Location</Label>
              <Input id="l" name="location" defaultValue={instructor.location ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="b">Your teaching story</Label>
            <Textarea
              id="b"
              name="bio"
              rows={4}
              placeholder="Share what you teach, what inspires your practice, and what students can expect."
              defaultValue={instructor.bio ?? ""}
            />
          </div>
          <div id="contact-details" className={styles["sectionHeading"]}>
            <span>
              <Flower2 size={21} strokeWidth={1.4} />
            </span>
            <div>
              <h2>The practical details</h2>
              <p>Your contact information, payment currency, and booking link.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="e">Email</Label>
              <Input id="e" type="email" name="email" defaultValue={instructor.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p">Phone</Label>
              <Input id="p" type="tel" name="phone" defaultValue={instructor.phone ?? ""} />
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
          <div className="flex justify-end">
            <Button type="submit" variant="clay" disabled={profilePending}>
              {profilePending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save profile"
              )}
            </Button>
          </div>
        </form>

        <form id="social-links" className={styles["form"]} onSubmit={handleSocialsSubmit}>
          <div className={styles["sectionHeading"]}>
            <span>
              <Link2 size={21} strokeWidth={1.4} />
            </span>
            <div>
              <h2>Stay connected</h2>
              <p>Add social links to your public page. Leave any blank to hide them.</p>
            </div>
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
                "Save social links"
              )}
            </Button>
          </div>
        </form>

        <div className={styles["quickLinks"]}>
          {quickLinks.map((l) => (
            <div key={l.href} className={styles["quickLink"]}>
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

        <div className={styles["danger"]}>
          <div>
            <h2 className="text-sm font-medium text-destructive">Account settings</h2>
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
