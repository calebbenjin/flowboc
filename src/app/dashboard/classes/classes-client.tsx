"use client";

import { dashboardIcons } from "@/components/dashboard-icons";

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
  Pencil,
  Plus,
  Settings2,
  Trash2,
  XCircle,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { MobileSheet, SheetAction, sheetActionClass } from "@/components/MobileSheet";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ClassesEmpty } from "./ClassesEmpty";
import { ClassCalendar } from "./class-calendar";
import { classFilters, matchesClassFilter, type ClassFilter } from "./class-filters";

type ClassWithBookingCount = YogaClass & { _count: { bookings: number } };

function tone(status: YogaClass["status"]) {
  if (status === "PUBLISHED") return "good" as const;
  if (status === "FULL") return "warn" as const;
  if (status === "CANCELLED") return "bad" as const;
  return "neutral" as const;
}

type ConfirmTarget = { id: string; action: "cancel" | "delete" };

type ClassGroup =
  | { type: "single"; cls: ClassWithBookingCount }
  | { type: "series"; seriesId: string; occurrences: ClassWithBookingCount[] };

function groupClasses(classes: ClassWithBookingCount[]): ClassGroup[] {
  const seriesOccurrences = new Map<string, ClassWithBookingCount[]>();
  const order: Array<
    { type: "single"; cls: ClassWithBookingCount } | { type: "series"; seriesId: string }
  > = [];

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

export function ClassesClient({ classes }: { classes: ClassWithBookingCount[] }) {
  const router = useRouter();
  const instructor = useInstructor();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [sheetClass, setSheetClass] = useState<ClassWithBookingCount | null>(null);

  const [compact, setCompact] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ClassFilter>("upcoming");
  const now = new Date();
  const filteredClasses = classes.filter((cls) => matchesClassFilter(cls, filter, search, now));

  const seriesCount = new Set(classes.filter((c) => c.seriesId).map((c) => c.seriesId)).size;
  const groups = groupClasses(filteredClasses);

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
            {classes.length
              ? `${classes.length} classes · ${seriesCount} recurring series`
              : "A space for the practice you love to teach."}
          </p>
        </div>
        {classes.length > 0 && (
          <Button asChild variant="clay" className="hidden md:inline-flex">
            <Link href="/dashboard/classes/new">Create class</Link>
          </Button>
        )}
      </div>

      {classes.length > 0 ? (
        <div className="mt-6 space-y-3">
          <label className="block text-sm font-medium md:max-w-sm">
            <span className="sr-only md:not-sr-only">Search classes</span>
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by class name"
              className="mt-1 text-base md:text-sm"
            />
          </label>
          <div
            className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
            role="group"
            aria-label="Filter classes"
          >
            {classFilters.map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                variant={filter === value ? "clay" : "quiet"}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className="shrink-0"
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Class view">
            <Button
              size="sm"
              variant={view === "list" ? "clay" : "quiet"}
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              List
            </Button>
            <Button
              size="sm"
              variant={view === "calendar" ? "clay" : "quiet"}
              aria-pressed={view === "calendar"}
              onClick={() => setView("calendar")}
            >
              Calendar
            </Button>
          </div>
          {view === "list" ? (
            <Button
              size="sm"
              variant="quiet"
              className="hidden md:inline-flex"
              aria-pressed={compact}
              onClick={() => setCompact((value) => !value)}
            >
              {compact ? "Switch to card view" : "Switch to compact view"}
            </Button>
          ) : null}
          <p className="text-sm text-muted-foreground md:ml-0" role="status">
            {filteredClasses.length} matching {filteredClasses.length === 1 ? "class" : "classes"}
          </p>
        </div>
      ) : null}

      {classes.length === 0 ? (
        <ClassesEmpty />
      ) : view === "calendar" ? (
        <ClassCalendar classes={filteredClasses} timezone={instructor.timezone} />
      ) : filteredClasses.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={dashboardIcons.classes}
          title="No matching classes"
          body="Try another status or clear your search."
          action={
            <Button
              variant="quiet"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              Show all classes
            </Button>
          }
        />
      ) : (
        <>
          <ul className="mb-20 mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white md:hidden">
            {groups.map((group) =>
              group.type === "single" ? (
                <li key={group.cls.id}>
                  <MobileClassRow cls={group.cls} onMore={() => setSheetClass(group.cls)} />
                </li>
              ) : (
                <li key={group.seriesId}>
                  <MobileClassRow
                    cls={group.occurrences[0]!}
                    dates={group.occurrences.length}
                    expanded={expandedSeries.has(group.seriesId)}
                    onToggle={() => toggleSeries(group.seriesId)}
                    onMore={() => setSheetClass(group.occurrences[0]!)}
                  />
                  {expandedSeries.has(group.seriesId) ? (
                    <ul className="border-t border-border bg-[#faf8fc] py-1">
                      {group.occurrences.map((o) => (
                        <li key={o.id} className="flex items-center">
                          <Link
                            href={`/dashboard/classes/${o.id}`}
                            className="flex min-h-12 flex-1 items-center justify-between gap-3 pl-[5.25rem] pr-2 active:bg-secondary"
                          >
                            <span>
                              <span className="block text-sm">{formatClassDate(o)}</span>
                              <span className="block text-xs text-muted-foreground">
                                {formatClassTime(o)} · {o._count.bookings}/{o.capacity} booked
                              </span>
                            </span>
                            <StatusPill tone={tone(o.status)}>{o.status.toLowerCase()}</StatusPill>
                          </Link>
                          <button
                            type="button"
                            aria-label={`More actions for ${formatClassDate(o)}`}
                            onClick={() => setSheetClass(o)}
                            className="grid size-12 shrink-0 place-items-center text-muted-foreground active:bg-secondary"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ),
            )}
          </ul>
          <div
            className={
              compact
                ? "mt-6 hidden space-y-3 md:block"
                : "mt-6 hidden gap-4 md:grid md:grid-cols-2"
            }
          >
            {groups.map((group) =>
              group.type === "single" ? (
                <ClassCard
                  key={group.cls.id}
                  cls={group.cls}
                  compact={compact}
                  duplicatingId={duplicatingId}
                  onDuplicate={handleDuplicate}
                  onCancel={(id) => setConfirmTarget({ id, action: "cancel" })}
                  onDelete={(id) => setConfirmTarget({ id, action: "delete" })}
                />
              ) : (
                <SeriesCard
                  key={group.seriesId}
                  occurrences={group.occurrences}
                  compact={compact}
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
        </>
      )}

      {classes.length > 0 ? (
        <Link
          href="/dashboard/classes/new"
          aria-label="Create class"
          className="fixed right-4 z-30 grid size-14 place-items-center rounded-full bg-clay text-white shadow-lg transition-transform active:scale-95 md:hidden"
          style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          <Plus className="size-6" />
        </Link>
      ) : null}

      <MobileSheet
        open={sheetClass !== null}
        onOpenChange={(open) => !open && setSheetClass(null)}
        title={sheetClass?.name ?? ""}
        description={
          sheetClass
            ? `${formatClassDate(sheetClass)} · ${formatClassTime(sheetClass)} ${timezoneLabel(sheetClass.timezone)}`
            : undefined
        }
      >
        {sheetClass ? (
          <div className="-mx-3">
            <Link href={`/dashboard/classes/${sheetClass.id}`} className={sheetActionClass}>
              <Settings2 className="size-5 text-muted-foreground" /> Manage bookings
            </Link>
            <Link href={`/dashboard/classes/edit/${sheetClass.id}`} className={sheetActionClass}>
              <Pencil className="size-5 text-muted-foreground" /> Edit class
            </Link>
            <SheetAction
              icon={
                duplicatingId === sheetClass.id ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                ) : (
                  <Copy className="size-5 text-muted-foreground" />
                )
              }
              disabled={duplicatingId === sheetClass.id}
              onClick={() => {
                const cls = sheetClass;
                setSheetClass(null);
                void handleDuplicate(cls);
              }}
            >
              Duplicate class
            </SheetAction>
            {sheetClass.status !== "CANCELLED" ? (
              <div className="my-1 border-t border-border" />
            ) : null}
            {sheetClass.status !== "CANCELLED" ? (
              <SheetAction
                destructive
                icon={<XCircle className="size-5" />}
                onClick={() => {
                  const id = sheetClass.id;
                  setSheetClass(null);
                  setConfirmTarget({ id, action: "cancel" });
                }}
              >
                Cancel class
              </SheetAction>
            ) : null}
            {sheetClass.status === "DRAFT" ? (
              <SheetAction
                destructive
                icon={<Trash2 className="size-5" />}
                onClick={() => {
                  const id = sheetClass.id;
                  setSheetClass(null);
                  setConfirmTarget({ id, action: "delete" });
                }}
              >
                Delete class
              </SheetAction>
            ) : null}
          </div>
        ) : null}
      </MobileSheet>

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
                ? "Booked students will be notified. Any paid bookings require a manual refund through your payment provider."
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
  cls: ClassWithBookingCount;
  compact?: boolean;
  duplicatingId: string | null;
  onDuplicate: (cls: ClassWithBookingCount) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
};

// Phone row: thumbnail, name, when, and how full. Tapping opens the class
// (or, for a series, its dates); `⋯` opens the action sheet.
function MobileClassRow({
  cls: c,
  dates,
  expanded = false,
  onToggle,
  onMore,
}: {
  cls: ClassWithBookingCount;
  dates?: number;
  expanded?: boolean;
  onToggle?: () => void;
  onMore: () => void;
}) {
  const instructor = useInstructor();
  const fill = Math.min(100, (c._count.bookings / c.capacity) * 100);
  const body = (
    <>
      {c.coverUrl ? (
        <img
          src={c.coverUrl}
          alt=""
          loading="lazy"
          width={112}
          height={112}
          className="size-14 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span className="size-14 shrink-0 rounded-xl bg-sand" />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[0.95rem] font-medium">{c.name}</span>
          {dates ? (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {dates} dates
              {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </span>
          ) : (
            <StatusPill tone={tone(c.status)}>{c.status.toLowerCase()}</StatusPill>
          )}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {dates
            ? `${c.recurringLabel ?? "Recurring"} · Next ${formatClassDate(c)}`
            : (c.recurringLabel ?? formatClassDate(c))}{" "}
          · {formatClassTime(c)}
        </span>
        <span className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-1 flex-1 rounded-full bg-secondary">
            <span className="block h-1 rounded-full bg-clay" style={{ width: `${fill}%` }} />
          </span>
          <span className="shrink-0 tabular-nums">
            {c._count.bookings}/{c.capacity}
          </span>
          <PriceTag
            price={c.price}
            currency={instructor.currency}
            priceClassName="font-medium text-foreground"
          />
        </span>
      </span>
    </>
  );
  const rowClass = "flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left active:bg-[#f8f5fc]";

  return (
    <div className="flex items-center">
      {dates && onToggle ? (
        <button type="button" onClick={onToggle} aria-expanded={expanded} className={rowClass}>
          {body}
        </button>
      ) : (
        <Link href={`/dashboard/classes/${c.id}`} className={rowClass}>
          {body}
        </Link>
      )}
      <button
        type="button"
        aria-label={`More actions for ${c.name}`}
        onClick={onMore}
        className="grid w-12 shrink-0 place-items-center self-stretch text-muted-foreground active:bg-secondary"
      >
        <MoreHorizontal className="size-5" />
      </button>
    </div>
  );
}

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

function ClassCard({
  cls: c,
  compact = false,
  duplicatingId,
  onDuplicate,
  onCancel,
  onDelete,
}: ClassActionsProps) {
  const instructor = useInstructor();
  return (
    <div className="surface overflow-hidden">
      {compact ? null : c.coverUrl ? (
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
          <span className="text-muted-foreground">
            {c._count.bookings} / {c.capacity} booked
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-secondary">
          <div
            className="h-1.5 rounded-full bg-clay"
            style={{ width: `${Math.min(100, (c._count.bookings / c.capacity) * 100)}%` }}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
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
  compact: boolean;
  occurrences: ClassWithBookingCount[];
  expanded: boolean;
  onToggle: () => void;
  duplicatingId: string | null;
  onDuplicate: (cls: ClassWithBookingCount) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
};

function SeriesCard({
  compact,
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
      {compact ? null : next.coverUrl ? (
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
          <span className="text-muted-foreground">
            {next._count.bookings} / {next.capacity} booked
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-secondary">
          <div
            className="h-1.5 rounded-full bg-clay"
            style={{ width: `${Math.min(100, (next._count.bookings / next.capacity) * 100)}%` }}
          />
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
