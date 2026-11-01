"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { FileText, ImagePlus, Loader2, X } from "lucide-react";
import { useInstructor } from "@/components/InstructorProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { compressImage } from "@/lib/compress-image";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { cn } from "@/lib/utils";
import { updateVideoCallOffer, updateEbookOffer } from "./actions";
import styles from "./offers.module.css";
function VideoCallImageUpload({
  value,
  onChange,
  onBusyChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  async function handleFile(file: File) {
    if (uploading) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setUploading(true);
    onBusyChange?.(true);
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
      onBusyChange?.(false);
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

function EbookFileUpload({
  value,
  onChange,
  onBusyChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (uploading) return;
    if (!["application/pdf", "application/epub+zip"].includes(file.type)) {
      toast.error("Please choose a PDF or EPUB file.");
      return;
    }
    setUploading(true);
    onBusyChange?.(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/ebooks/upload",
      });
      setFileName(file.name);
      onChange(blob.url);
    } catch {
      toast.error("Couldn't upload file. Please try again.");
    } finally {
      setUploading(false);
      onBusyChange?.(false);
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
      className="relative flex h-16 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-primary/10"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,application/epub+zip"
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
          <FileText className="size-4 shrink-0" />
          <span className="truncate">{fileName ?? "File uploaded — click to replace"}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove file"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={(e) => {
              e.stopPropagation();
              setFileName(null);
              onChange(null);
            }}
          >
            <X className="size-4" />
          </Button>
        </>
      ) : (
        <span className="flex items-center gap-2">
          <FileText className="size-4" />
          Click to upload a PDF or EPUB (max 50MB)
        </span>
      )}
    </div>
  );
}

export function OfferSetupForm({ kind }: { kind: "session" | "ebook" }) {
  const router = useRouter();
  const instructor = useInstructor();
  const [dirty, setDirty] = useState(false);
  const [busyUploads, setBusyUploads] = useState(0);
  const onUploadBusy = (busy: boolean) =>
    setBusyUploads((count) => Math.max(0, count + (busy ? 1 : -1)));
  const { dialog: leaveDialog } = useUnsavedChanges(
    dirty,
    "Your offer changes have not been saved. Stay here to save them, or discard them and leave.",
  );
  const [videoCallEnabled, setVideoCallEnabled] = useState(instructor.videoCallEnabled);
  const [videoCallImageUrl, setVideoCallImageUrl] = useState<string | null>(
    instructor.videoCallImageUrl,
  );
  const [videoCallPending, setVideoCallPending] = useState(false);

  const [ebookEnabled, setEbookEnabled] = useState(instructor.ebookEnabled);
  const [ebookCoverUrl, setEbookCoverUrl] = useState<string | null>(instructor.ebookCoverUrl);
  const [ebookFileUrl, setEbookFileUrl] = useState<string | null>(instructor.ebookFileUrl);
  const [ebookPending, setEbookPending] = useState(false);

  async function handleVideoCallSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busyUploads > 0 || videoCallPending || ebookPending) return;
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
        setDirty(false);
        toast.success("1:1 session offer saved");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Couldn’t save your session. Your changes are still here; please try again.");
    } finally {
      setVideoCallPending(false);
    }
  }

  async function handleEbookSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busyUploads > 0 || videoCallPending || ebookPending) return;
    const formData = new FormData(e.currentTarget);
    const price = String(formData.get("ebookPrice") ?? "").trim();

    setEbookPending(true);
    try {
      const result = await updateEbookOffer({
        enabled: ebookEnabled,
        title: String(formData.get("ebookTitle") ?? ""),
        description: String(formData.get("ebookDescription") ?? ""),
        coverUrl: ebookCoverUrl,
        fileUrl: ebookFileUrl,
        price: price ? Number(price) : null,
      });
      if (result.ok) {
        setDirty(false);
        toast.success("Ebook offer saved");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Couldn’t save your ebook. Your changes are still here; please try again.");
    } finally {
      setEbookPending(false);
    }
  }

  const visibilityMessage =
    kind === "session"
      ? videoCallEnabled
        ? "Save to show this session on your public page."
        : "This session is hidden from students. Turn it on when you’re ready."
      : ebookEnabled
        ? "Save to show this ebook on your public page."
        : "This ebook is hidden from students. Turn it on when you’re ready.";
  return (
    <div id="offer-setup" className={styles["setup"]}>
      {kind === "session" ? (
        <form
          className="space-y-5"
          onChangeCapture={() => setDirty(true)}
          onSubmit={(e) => void handleVideoCallSubmit(e)}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl">Your 1:1 session</h2>
              <p className="text-xs text-muted-foreground">
                Shown as a bookable card on your public page, for 1:1 video calls instead of a
                scheduled class.
              </p>
            </div>
            <Switch
              checked={videoCallEnabled}
              aria-label="Show 1:1 session on my public page"
              onCheckedChange={(enabled) => {
                setVideoCallEnabled(enabled);
                setDirty(true);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vctitle">Title</Label>
            <Input
              id="vctitle"
              name="videoCallTitle"
              defaultValue={instructor.videoCallTitle ?? ""}
              placeholder="A little space for your practice"
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
            <VideoCallImageUpload
              value={videoCallImageUrl}
              onChange={(value) => {
                setVideoCallImageUrl(value);
                setDirty(true);
              }}
              onBusyChange={onUploadBusy}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vcprice">Price (optional)</Label>
              <Input
                id="vcprice"
                name="videoCallPrice"
                type="number"
                min={0}
                step="0.01"
                defaultValue={instructor.videoCallPrice ?? ""}
                placeholder="Leave blank for free"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for free. A priced call charges through Paystack at booking — stays
                &quot;Coming soon&quot; on your page until you&apos;ve{" "}
                <Link href="/dashboard/payouts" className="underline underline-offset-2">
                  connected a payout account
                </Link>
                .
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vclink">Scheduling or meeting link</Label>
              <Input
                id="vclink"
                name="videoCallLink"
                type="url"
                defaultValue={instructor.consultationLink ?? ""}
                placeholder="https://calendly.com/you or https://zoom.us/j/…"
              />
              <p className="text-xs text-muted-foreground">
                Sent to students by email once they book — this is where they&apos;ll pick a time
                with you.
              </p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{visibilityMessage}</p>
          <div className={styles["saveBar"]}>
            <Button type="submit" variant="clay" disabled={videoCallPending || busyUploads > 0}>
              {videoCallPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : busyUploads > 0 ? (
                "Uploading…"
              ) : (
                "Save offer"
              )}
            </Button>
          </div>
        </form>
      ) : (
        <form
          className="space-y-5"
          onChangeCapture={() => setDirty(true)}
          onSubmit={(e) => void handleEbookSubmit(e)}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl">Your ebook</h2>
              <p className="text-xs text-muted-foreground">
                Sell a digital download — a PDF or EPUB — as a card on your public page.
              </p>
            </div>
            <Switch
              checked={ebookEnabled}
              aria-label="Show ebook on my public page"
              onCheckedChange={(enabled) => {
                setEbookEnabled(enabled);
                setDirty(true);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ebtitle">Title</Label>
            <Input
              id="ebtitle"
              name="ebookTitle"
              defaultValue={instructor.ebookTitle ?? ""}
              placeholder="Your everyday practice guide"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ebdesc">Description</Label>
            <Textarea
              id="ebdesc"
              name="ebookDescription"
              rows={2}
              defaultValue={instructor.ebookDescription ?? ""}
              placeholder="What's inside, and who it's for."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cover image</Label>
              <VideoCallImageUpload
                value={ebookCoverUrl}
                onChange={(value) => {
                  setEbookCoverUrl(value);
                  setDirty(true);
                }}
                onBusyChange={onUploadBusy}
              />
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <EbookFileUpload
                value={ebookFileUrl}
                onChange={(value) => {
                  setEbookFileUrl(value);
                  setDirty(true);
                }}
                onBusyChange={onUploadBusy}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ebprice">Price (optional)</Label>
            <Input
              id="ebprice"
              name="ebookPrice"
              type="number"
              min={0}
              step="0.01"
              defaultValue={instructor.ebookPrice ?? ""}
              placeholder="Leave blank for free"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank for a free download. A priced ebook charges through Paystack at checkout —
              stays &quot;Coming soon&quot; on your page until you&apos;ve{" "}
              <Link href="/dashboard/payouts" className="underline underline-offset-2">
                connected a payout account
              </Link>
              .
            </p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{visibilityMessage}</p>
          <div className={styles["saveBar"]}>
            <Button type="submit" variant="clay" disabled={ebookPending || busyUploads > 0}>
              {ebookPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : busyUploads > 0 ? (
                "Uploading…"
              ) : (
                "Save offer"
              )}
            </Button>
          </div>
        </form>
      )}
      {leaveDialog}
    </div>
  );
}
