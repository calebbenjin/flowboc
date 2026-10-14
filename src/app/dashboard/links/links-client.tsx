"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { toast } from "sonner";
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
import { GripVertical, Link2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
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
import { createLink, deleteLink, reorderLinks, toggleLinkActive, updateLink } from "./actions";

type EditTarget = { id: string; label: string; url: string } | null;

function SortableRow({
  link,
  onEdit,
  onDelete,
  onToggle,
  togglingId,
}: {
  link: InstructorLink;
  onEdit: (link: InstructorLink) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  togglingId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`surface flex items-center gap-3 p-4 ${isDragging ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

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

export function LinksClient({
  links: initialLinks,
  slug,
}: {
  links: InstructorLink[];
  slug: string;
}) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);

  // router.refresh() re-runs the server component and passes fresh props,
  // but useState only reads its initial value once — sync local state
  // (needed here for optimistic reorder/toggle) back to the server's copy
  // whenever it changes.
  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [creating, setCreating] = useState(false);
  const [formLabel, setFormLabel] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function openCreate() {
    setEditTarget(null);
    setCreating(true);
    setFormLabel("");
    setFormUrl("");
  }

  function openEdit(link: InstructorLink) {
    setEditTarget({ id: link.id, label: link.label, url: link.url });
    setFormLabel(link.label);
    setFormUrl(link.url);
    setCreating(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const result = editTarget
        ? await updateLink(editTarget.id, { label: formLabel, url: formUrl })
        : await createLink({ label: formLabel, url: formUrl });
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
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, isActive } : l)));
    setTogglingId(id);
    try {
      const result = await toggleLinkActive(id, isActive);
      if (!result.ok) {
        setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, isActive: !isActive } : l)));
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
        setLinks((prev) => prev.filter((l) => l.id !== deleteId));
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

    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(links, oldIndex, newIndex);
    setLinks(reordered);

    const result = await reorderLinks(reordered.map((l) => l.id));
    if (!result.ok) {
      setLinks(links);
      toast.error(result.error);
    }
  }

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Links</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add custom links to your public page at flowboc.com/{slug} — drag to reorder.
          </p>
        </div>
        <Button variant="clay" onClick={openCreate}>
          <Plus className="size-4" />
          Add link
        </Button>
      </div>

      {links.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Link2}
          title="No links yet"
          body="Add links to your Instagram, website, or anywhere else you want to send visitors."
          action={
            <Button variant="clay" size="sm" onClick={openCreate}>
              Add link
            </Button>
          }
        />
      ) : (
        <DndContext
          id="instructor-links"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => void handleDragEnd(e)}
        >
          <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className="mt-6 flex flex-col gap-3">
              {links.map((link) => (
                <SortableRow
                  key={link.id}
                  link={link}
                  onEdit={openEdit}
                  onDelete={setDeleteId}
                  onToggle={(id, isActive) => void handleToggle(id, isActive)}
                  togglingId={togglingId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

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
