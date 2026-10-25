"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  Download,
  GripVertical,
  ImagePlus,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { InstructorLink } from "@/generated/prisma/client";
import { linkIdFromToken } from "@/lib/public-page-blocks";
import { createLink, deleteLink, reorderPageBlocks, toggleLinkActive, updateLink } from "./actions";

type EditTarget = { id: string; label: string; url: string; imageUrl: string | null } | null;

// Compact variant of profile-client.tsx's VideoCallImageUpload — same
// compress-then-upload-to-/api/upload flow, smaller footprint since a link
// photo is optional and secondary to the label/URL fields.
function LinkImageUpload({
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
      const compressed = await compressImage(file, { maxDimension: 800 });
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
        "relative flex h-16 cursor-pointer items-center gap-3 overflow-hidden rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-primary/10",
        dragActive && "border-clay bg-clay/5",
        value && "justify-start",
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
          <img src={value} alt="" className="size-10 shrink-0 rounded-md object-cover" />
          <span>Click to replace</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove image"
            className="absolute right-1 top-1/2 -translate-y-1/2"
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
          Add a photo (optional) — or leave blank
        </span>
      )}
    </div>
  );
}

type Block =
  | { token: string; kind: "LINK"; link: InstructorLink }
  | { token: "VIDEO_CALL"; kind: "VIDEO_CALL"; enabled: boolean; title: string | null }
  | { token: "EBOOK"; kind: "EBOOK"; enabled: boolean; title: string | null }
  | { token: "CLASSES"; kind: "CLASSES"; count: number };

function buildBlocks(
  blockOrder: string[],
  links: InstructorLink[],
  offers: {
    videoCallEnabled: boolean;
    videoCallTitle: string | null;
    ebookEnabled: boolean;
    ebookTitle: string | null;
    classesCount: number;
  },
): Block[] {
  const linksById = new Map(links.map((l) => [l.id, l]));
  return blockOrder
    .map((token): Block | null => {
      if (token === "VIDEO_CALL") {
        return {
          token,
          kind: "VIDEO_CALL",
          enabled: offers.videoCallEnabled,
          title: offers.videoCallTitle,
        };
      }
      if (token === "EBOOK") {
        return { token, kind: "EBOOK", enabled: offers.ebookEnabled, title: offers.ebookTitle };
      }
      if (token === "CLASSES") {
        return { token, kind: "CLASSES", count: offers.classesCount };
      }
      const linkId = linkIdFromToken(token);
      const link = linkId ? linksById.get(linkId) : undefined;
      return link ? { token, kind: "LINK", link } : null;
    })
    .filter((b): b is Block => b !== null);
}

function SortableBlockRow({
  block,
  onEdit,
  onDelete,
  onToggle,
  togglingId,
}: {
  block: Block;
  onEdit: (link: InstructorLink) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  togglingId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.token,
  });

  const dragHandle = (
    <button
      type="button"
      aria-label="Drag to reorder"
      className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );

  const rowClassName = `surface flex items-center gap-3 p-4 ${isDragging ? "opacity-60" : ""}`;

  if (block.kind === "LINK") {
    const { link } = block;
    return (
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={rowClassName}
      >
        {dragHandle}

        {link.imageUrl && (
          <img src={link.imageUrl} alt="" className="size-10 shrink-0 rounded-md object-cover" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{link.label}</p>
          <p className="truncate text-sm text-muted-foreground">{link.url}</p>
        </div>

        <span className="hidden text-sm text-muted-foreground sm:block">
          {link.clickCount} click{link.clickCount === 1 ? "" : "s"}
        </span>

        <Switch
          checked={link.isActive}
          disabled={togglingId === link.id}
          onCheckedChange={(checked) => onToggle(link.id, checked)}
          aria-label={link.isActive ? "Deactivate link" : "Activate link"}
        />

        <Button variant="ghost" size="icon" aria-label="Edit link" onClick={() => onEdit(link)}>
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete link"
          onClick={() => onDelete(link.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    );
  }

  const presets = {
    VIDEO_CALL: { icon: Video, label: "Video call", manageHref: "/dashboard/profile" },
    EBOOK: { icon: Download, label: "Ebook", manageHref: "/dashboard/profile" },
    CLASSES: { icon: CalendarDays, label: "Upcoming classes", manageHref: "/dashboard/classes" },
  } as const;
  const preset = presets[block.kind];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={rowClassName}
    >
      {dragHandle}
      <preset.icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {block.kind === "CLASSES"
            ? `${preset.label} (${block.count})`
            : block.title || preset.label}
        </p>
      </div>
      {block.kind !== "CLASSES" && (
        <StatusPill tone={block.enabled ? "good" : "neutral"}>
          {block.enabled ? "enabled" : "disabled"}
        </StatusPill>
      )}
      <Button asChild variant="ghost" size="sm">
        <NextLink href={preset.manageHref}>Manage</NextLink>
      </Button>
    </div>
  );
}

export function LinksClient({
  links: initialLinks,
  slug,
  blockOrder: initialBlockOrder,
  videoCallEnabled,
  videoCallTitle,
  ebookEnabled,
  ebookTitle,
  classesCount,
}: {
  links: InstructorLink[];
  slug: string;
  blockOrder: string[];
  videoCallEnabled: boolean;
  videoCallTitle: string | null;
  ebookEnabled: boolean;
  ebookTitle: string | null;
  classesCount: number;
}) {
  const router = useRouter();
  const offers = { videoCallEnabled, videoCallTitle, ebookEnabled, ebookTitle, classesCount };
  const [blocks, setBlocks] = useState(() => buildBlocks(initialBlockOrder, initialLinks, offers));

  // router.refresh() re-runs the server component and passes fresh props,
  // but useState only reads its initial value once — sync local state
  // (needed here for optimistic reorder/toggle) back to the server's copy
  // whenever it changes.
  useEffect(() => {
    setBlocks(buildBlocks(initialBlockOrder, initialLinks, offers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialBlockOrder,
    initialLinks,
    videoCallEnabled,
    videoCallTitle,
    ebookEnabled,
    ebookTitle,
    classesCount,
  ]);

  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [creating, setCreating] = useState(false);
  const [formLabel, setFormLabel] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const linkCount = blocks.filter((b) => b.kind === "LINK").length;

  function openCreate() {
    setEditTarget(null);
    setCreating(true);
    setFormLabel("");
    setFormUrl("");
    setFormImageUrl(null);
  }

  function openEdit(link: InstructorLink) {
    setEditTarget({ id: link.id, label: link.label, url: link.url, imageUrl: link.imageUrl });
    setFormLabel(link.label);
    setFormUrl(link.url);
    setFormImageUrl(link.imageUrl);
    setCreating(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = editTarget
        ? await updateLink(editTarget.id, {
            label: formLabel,
            url: formUrl,
            imageUrl: formImageUrl,
          })
        : await createLink({ label: formLabel, url: formUrl, imageUrl: formImageUrl });
      if (result.ok) {
        if (
          !editTarget &&
          process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
          process.env["NEXT_PUBLIC_POSTHOG_HOST"]
        ) {
          posthog.capture("instructor_link_created");
        }
        toast.success(editTarget ? "Link updated" : "Link added");
        setCreating(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.kind === "LINK" && b.link.id === id ? { ...b, link: { ...b.link, isActive } } : b,
      ),
    );
    setTogglingId(id);
    try {
      const result = await toggleLinkActive(id, isActive);
      if (!result.ok) {
        setBlocks((prev) =>
          prev.map((b) =>
            b.kind === "LINK" && b.link.id === id
              ? { ...b, link: { ...b.link, isActive: !isActive } }
              : b,
          ),
        );
        toast.error(result.error);
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const result = await deleteLink(deleteId);
      if (result.ok) {
        if (
          process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
          process.env["NEXT_PUBLIC_POSTHOG_HOST"]
        ) {
          posthog.capture("instructor_link_deleted");
        }
        toast.success("Link deleted");
        setBlocks((prev) => prev.filter((b) => !(b.kind === "LINK" && b.link.id === deleteId)));
        setDeleteId(null);
      } else {
        toast.error(result.error);
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.token === active.id);
    const newIndex = blocks.findIndex((b) => b.token === over.id);
    const reordered = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(reordered);

    const result = await reorderPageBlocks(reordered.map((b) => b.token));
    if (!result.ok) {
      setBlocks(blocks);
      toast.error(result.error);
    }
  }

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Links</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag to reorder everything on your public page at flowboc.com/{slug} — your video call
            and ebook offers, your upcoming classes, and any custom links.
          </p>
        </div>
        <Button variant="clay" onClick={openCreate}>
          <Plus className="size-4" />
          Add link
        </Button>
      </div>

      {linkCount === 0 && (
        <EmptyState
          className="mt-6"
          icon={Link2}
          title="No custom links yet"
          body="Add links to your Instagram, website, or anywhere else you want to send visitors — they'll join your video call, ebook, and classes blocks below, in whatever order you drag them into."
          action={
            <Button variant="clay" size="sm" onClick={openCreate}>
              Add link
            </Button>
          }
        />
      )}

      <DndContext
        id="public-page-blocks"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e) => void handleDragEnd(e)}
      >
        <SortableContext items={blocks.map((b) => b.token)} strategy={verticalListSortingStrategy}>
          <div className="mt-6 flex flex-col gap-3">
            {blocks.map((block) => (
              <SortableBlockRow
                key={block.token}
                block={block}
                onEdit={openEdit}
                onDelete={setDeleteId}
                onToggle={(id, isActive) => void handleToggle(id, isActive)}
                togglingId={togglingId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit link" : "Add link"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="link-label">Label</Label>
              <Input
                id="link-label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="Follow me on Instagram"
                maxLength={100}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Photo</Label>
              <LinkImageUpload value={formImageUrl} onChange={setFormImageUrl} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button variant="clay" disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {editTarget ? "Save changes" : "Add link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this link?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from your public page immediately. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Never mind
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>
              {deleting ? "Deleting…" : "Delete link"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
