"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  MoreHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/PriceTag";
import { useInstructor } from "@/components/InstructorProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { timezoneLabel } from "@/lib/demo";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import type { YogaClass } from "@/generated/prisma/client";
import { cancelClass, deleteClass, duplicateClass } from "./actions";

function tone(status: YogaClass["status"]) {
  if (status === "PUBLISHED") return "good" as const;
  if (status === "FULL") return "warn" as const;
  if (status === "CANCELLED") return "bad" as const;
  return "neutral" as const;
}

type ConfirmTarget = { id: string; action: "cancel" | "delete" };

type ClassGroup =
  | { type: "single"; cls: YogaClass }
  | { type: "series"; seriesId: string; occurrences: YogaClass[] };

function groupClasses(classes: YogaClass[]): ClassGroup[] {
  const seriesOccurrences = new Map<string, YogaClass[]>();
  const order: Array<{ type: "single"; cls: YogaClass } | { type: "series"; seriesId: string }> =
    [];

  for (const c of classes) {
    if (!c.seriesId) {
      order.push({ type: "single", cls: c });
      continue;
    }
    const existing = seriesOccurrences.get(c.seriesId);
    if (existing) {
      existing.push(c);
    } else {
      seriesOccurrences.set(c.seriesId, [c]);
      order.push({ type: "series", seriesId: c.seriesId });
    }
  }

  return order.map((entry) =>
    entry.type === "single"
      ? entry
      : {
          type: "series" as const,
          seriesId: entry.seriesId,
          // Set right before pushing to `order`, so this is always present.
          occurrences: seriesOccurrences.get(entry.seriesId)!,
        },
  );
}

export function ClassesClient({ classes }: { classes: YogaClass[] }) {
  const router = useRouter();
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());

  const seriesCount = new Set(classes.filter((c) => c.seriesId).map((c) => c.seriesId)).size;
  const groups = groupClasses(classes);

  function toggleSeries(seriesId: string) {
    setExpandedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(seriesId)) next.delete(seriesId);
      else next.add(seriesId);
      return next;
    });
  }

  async function handleDuplicate(cls: YogaClass) {
    setDuplicatingId(cls.id);
    try {
      const result = await duplicateClass(cls.id);
      if (result.ok) {
        toast.success(`Duplicated as "${cls.name} (copy)"`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleConfirm() {
    if (!confirmTarget) return;
    const { id, action } = confirmTarget;
    setConfirmPending(true);
    try {
      const result = action === "cancel" ? await cancelClass(id) : await deleteClass(id);
      if (result.ok) {
        toast.success(action === "cancel" ? "Class cancelled" : "Class deleted");
        setConfirmTarget(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setConfirmPending(false);
    }
  }

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Classes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {classes.length} classes · {seriesCount} recurring series
          </p>
        </div>
        <Button asChild variant="clay">
          <Link href="/dashboard/classes/new">Create class</Link>
        </Button>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={CalendarDays}
          title="No classes yet"
          body="Create your first class to start taking bookings."
          action={
            <Button asChild variant="clay" size="sm">
              <Link href="/dashboard/classes/new">Create class</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {groups.map((group) =>
            group.type === "single" ? (
              <ClassCard
                key={group.cls.id}
                cls={group.cls}
                duplicatingId={duplicatingId}
                onDuplicate={handleDuplicate}
                onCancel={(id) => setConfirmTarget({ id, action: "cancel" })}
                onDelete={(id) => setConfirmTarget({ id, action: "delete" })}
              />
            ) : (
              <SeriesCard
                key={group.seriesId}
                occurrences={group.occurrences}
                expanded={expandedSeries.has(group.seriesId)}
                onToggle={() => toggleSeries(group.seriesId)}
                duplicatingId={duplicatingId}
                onDuplicate={handleDuplicate}
                onCancel={(id) => setConfirmTarget({ id, action: "cancel" })}
                onDelete={(id) => setConfirmTarget({ id, action: "delete" })}
              />
            ),
          )}
        </div>
      )}

      <AlertDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget?.action === "cancel" ? "Cancel this class?" : "Delete this class?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.action === "cancel"
                ? "Booked students (once bookings exist) will be notified and refunded."
                : "This draft class will be permanently deleted. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              Never mind
            </Button>
            <Button
              variant="destructive"
              disabled={confirmPending}
              onClick={() => void handleConfirm()}
            >
              {confirmPending
                ? confirmTarget?.action === "cancel"
                  ? "Cancelling…"
                  : "Deleting…"
                : confirmTarget?.action === "cancel"
                  ? "Cancel class"
                  : "Delete class"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}

type ClassActionsProps = {
  cls: YogaClass;
  duplicatingId: string | null;
  onDuplicate: (cls: YogaClass) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
};

function ClassMenu({ cls, duplicatingId, onDuplicate, onCancel, onDelete }: ClassActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="More actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={duplicatingId === cls.id} onClick={() => onDuplicate(cls)}>
          {duplicatingId === cls.id ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Copy className="size-4" />
          )}
          Duplicate class
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {cls.status !== "CANCELLED" && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onCancel(cls.id)}
          >
            <XCircle className="size-4" /> Cancel class
          </DropdownMenuItem>
        )}
        {cls.status === "DRAFT" && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(cls.id)}
          >
            <Trash2 className="size-4" /> Delete class
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ClassCard({ cls: c, duplicatingId, onDuplicate, onCancel, onDelete }: ClassActionsProps) {
  const instructor = useInstructor();
  return (
    <div className="surface overflow-hidden">
      {c.coverUrl ? (
        <img
          src={c.coverUrl}
          alt={c.name}
          loading="lazy"
          width={1200}
          height={800}
          className="h-36 w-full object-cover"
        />
      ) : (
        <div className="h-36 w-full bg-sand" />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg">{c.name}</h2>
            <p className="text-sm text-muted-foreground">
              {c.recurringLabel ?? formatClassDate(c)} · {formatClassTime(c)}{" "}
              {timezoneLabel(c.timezone)} · {c.durationMinutes} min
            </p>
          </div>
          <div className="flex items-center gap-1">
            <StatusPill tone={tone(c.status)}>{c.status.toLowerCase()}</StatusPill>
            <ClassMenu
              cls={c}
              duplicatingId={duplicatingId}
              onDuplicate={onDuplicate}
              onCancel={onCancel}
              onDelete={onDelete}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <PriceTag
            price={c.price}
            originalPrice={c.originalPrice ?? undefined}
            currency={instructor.currency}
            priceClassName="font-medium"
          />
          <span className="text-muted-foreground">0 / {c.capacity} booked</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-secondary">
          <div className="h-1.5 rounded-full bg-clay" style={{ width: "0%" }} />
        </div>

        <div className="mt-5 flex gap-2">
          <Button asChild size="sm" variant="quiet">
            <Link href={`/dashboard/classes/${c.id}`}>Manage</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/dashboard/classes/edit/${c.id}`}>Edit</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function OccurrenceRow({
  cls: c,
  duplicatingId,
  onDuplicate,
  onCancel,
  onDelete,
}: ClassActionsProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
      <div>
        <p className="text-sm">{formatClassDate(c)}</p>
        <p className="text-xs text-muted-foreground">{formatClassTime(c)}</p>
      </div>
      <div className="flex items-center gap-1">
        <StatusPill tone={tone(c.status)}>{c.status.toLowerCase()}</StatusPill>
        <Button asChild size="sm" variant="ghost">
          <Link href={`/dashboard/classes/${c.id}`}>Manage</Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href={`/dashboard/classes/edit/${c.id}`}>Edit</Link>
        </Button>
        <ClassMenu
          cls={c}
          duplicatingId={duplicatingId}
          onDuplicate={onDuplicate}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

type SeriesCardProps = {
  occurrences: YogaClass[];
  expanded: boolean;
  onToggle: () => void;
  duplicatingId: string | null;
  onDuplicate: (cls: YogaClass) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
};

function SeriesCard({
  occurrences,
  expanded,
  onToggle,
  duplicatingId,
  onDuplicate,
  onCancel,
  onDelete,
}: SeriesCardProps) {
  const instructor = useInstructor();
  // `occurrences` is already sorted ascending by startAt (inherited from the
  // parent query), so the first entry is the soonest date in the series.
  // Non-null: a series group is only ever created with at least one occurrence.
  const next = occurrences[0]!;
  const activeCount = occurrences.filter((o) => o.status !== "CANCELLED").length;

  return (
    <div className="surface overflow-hidden">
      {next.coverUrl ? (
        <img
          src={next.coverUrl}
          alt={next.name}
          loading="lazy"
          width={1200}
          height={800}
          className="h-36 w-full object-cover"
        />
      ) : (
        <div className="h-36 w-full bg-sand" />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg">{next.name}</h2>
            <p className="text-sm text-muted-foreground">
              {next.recurringLabel ?? "Recurring"} · Next {formatClassDate(next)} ·{" "}
              {formatClassTime(next)} {timezoneLabel(next.timezone)} · {next.durationMinutes} min
            </p>
          </div>
          <div className="flex items-center gap-1">
            <StatusPill tone={activeCount === 0 ? "bad" : "neutral"}>
              {activeCount === 0 ? "cancelled" : `${occurrences.length} dates`}
            </StatusPill>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <PriceTag
            price={next.price}
            originalPrice={next.originalPrice ?? undefined}
            currency={instructor.currency}
            priceClassName="font-medium"
          />
          <span className="text-muted-foreground">0 / {next.capacity} booked</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-secondary">
          <div className="h-1.5 rounded-full bg-clay" style={{ width: "0%" }} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="quiet">
            <Link href={`/dashboard/classes/${next.id}`}>Manage next</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/dashboard/classes/edit/${next.id}`}>Edit</Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={onToggle} className="ml-auto">
            {expanded ? (
              <>
                Hide dates <ChevronUp className="size-4" />
              </>
            ) : (
              <>
                View all {occurrences.length} dates <ChevronDown className="size-4" />
              </>
            )}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 flex flex-col gap-2">
            {occurrences.map((o) => (
              <OccurrenceRow
                key={o.id}
                cls={o}
                duplicatingId={duplicatingId}
                onDuplicate={onDuplicate}
                onCancel={onCancel}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
