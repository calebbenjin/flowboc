"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import posthog from "posthog-js";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";
import { ArrowUpRight, Gift, ImagePlus, Landmark, Loader2, X } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useInstructor } from "@/components/InstructorProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { cn } from "@/lib/utils";
import type { CurrencyCode, SocialPlatform } from "@/generated/prisma/enums";
import {
  deleteAccount,
  updatePhoto,
  updateProfile,
  updateSocials,
  updateVideoCallOffer,
} from "./actions";

function VideoCallImageUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setUploading(true);
    try {
      const compressed = await compressImage(file, { maxDimension: 1200 });
      const blob = await upload(compressed.name, compressed, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      onChange(blob.url);
    } catch {
      toast.error("Couldn't upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void handleFile(file);
      }}
      className={cn(
        "relative flex h-28 cursor-pointer items-center gap-4 overflow-hidden rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:bg-primary/10",
        dragActive && "border-clay bg-clay/5",
        value ? "justify-start p-3" : "justify-center",
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      {uploading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : value ? (
        <>
          <img src={value} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
          <span>Drop an image or click to replace</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove image"
            className="absolute right-2 top-2"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            <X className="size-4" />
          </Button>
        </>
      ) : (
        <span className="flex items-center gap-2">
          <ImagePlus className="size-4" />
          Drop an image or click to upload
        </span>
      )}
    </div>
  );
}

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

  const [videoCallEnabled, setVideoCallEnabled] = useState(instructor.videoCallEnabled);
  const [videoCallImageUrl, setVideoCallImageUrl] = useState<string | null>(
    instructor.videoCallImageUrl,
  );
  const [videoCallPending, setVideoCallPending] = useState(false);

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

  async function handleVideoCallSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const price = String(formData.get("videoCallPrice") ?? "").trim();

    setVideoCallPending(true);
    try {
      const result = await updateVideoCallOffer({
        enabled: videoCallEnabled,
        title: String(formData.get("videoCallTitle") ?? ""),
        description: String(formData.get("videoCallDescription") ?? ""),
        imageUrl: videoCallImageUrl,
        price: price ? Number(price) : null,
        meetingLink: String(formData.get("videoCallLink") ?? ""),
      });
      if (result.ok) {
        toast.success("Video call offer updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setVideoCallPending(false);
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

        <form
          className="surface mt-6 space-y-4 p-6"
          onSubmit={(e) => void handleVideoCallSubmit(e)}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium">Video call</h2>
              <p className="text-xs text-muted-foreground">
                Shown as a bookable card on your public page, for 1:1 video calls instead of a
                scheduled class.
              </p>
            </div>
            <Switch checked={videoCallEnabled} onCheckedChange={setVideoCallEnabled} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vctitle">Title</Label>
            <Input
              id="vctitle"
              name="videoCallTitle"
              defaultValue={instructor.videoCallTitle ?? ""}
              placeholder="Book a Video Call with Me"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vcdesc">Description</Label>
            <Textarea
              id="vcdesc"
              name="videoCallDescription"
              rows={2}
              defaultValue={instructor.videoCallDescription ?? ""}
              placeholder="I'm available on Mondays and Thursdays."
            />
          </div>
          <div className="space-y-2">
            <Label>Image</Label>
            <VideoCallImageUpload value={videoCallImageUrl} onChange={setVideoCallImageUrl} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vcprice">Price (optional)</Label>
              <Input
                id="vcprice"
                name="videoCallPrice"
                type="number"
                defaultValue={instructor.videoCallPrice ?? ""}
                placeholder="Leave blank for free"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for free. Paid calls show as &quot;Coming soon&quot; until checkout is
                available.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vclink">Meeting link</Label>
              <Input
                id="vclink"
                name="videoCallLink"
                defaultValue={instructor.consultationLink ?? ""}
                placeholder="https://zoom.us/j/… or Google Meet link"
              />
              <p className="text-xs text-muted-foreground">
                Sent to students by email once they book — and shown to them right away.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="clay" disabled={videoCallPending}>
              {videoCallPending ? (
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
