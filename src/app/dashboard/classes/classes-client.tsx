"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Copy, MoreHorizontal, Trash2, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/PriceTag";
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
import {
  classes as initialClasses,
  timezoneLabel,
  type ClassStatus,
  type YogaClass,
} from "@/lib/demo";
import { useMockAction } from "@/hooks/use-mock-action";

function tone(status: ClassStatus) {
  if (status === "published") return "good" as const;
  if (status === "full") return "warn" as const;
  if (status === "cancelled") return "bad" as const;
  return "neutral" as const;
}

type ConfirmTarget = { id: string; action: "cancel" | "delete" };

export function ClassesClient() {
  const [classList, setClassList] = useState<YogaClass[]>(initialClasses);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const statusAction = useMockAction();
  const duplicateAction = useMockAction();

  const confirmClass = confirmTarget ? classList.find((c) => c.id === confirmTarget.id) : null;

  function handleDuplicate(cls: YogaClass) {
    duplicateAction.run({
      success: `Duplicated as "${cls.name} (copy)"`,
      onDone: () => {
        setClassList((prev) => [
          {
            ...cls,
            id: `${cls.id}-copy-${Date.now()}`,
            name: `${cls.name} (copy)`,
            status: "draft",
            booked: 0,
          },
          ...prev,
        ]);
      },
    });
  }

  function handleConfirm() {
    if (!confirmTarget) return;
    const { id, action } = confirmTarget;
    statusAction.run({
      success: action === "cancel" ? "Class cancelled — students notified" : "Class deleted",
      onDone: () => {
        setClassList((prev) =>
          action === "delete"
            ? prev.filter((c) => c.id !== id)
            : prev.map((c) => (c.id === id ? { ...c, status: "cancelled" } : c)),
        );
        setConfirmTarget(null);
      },
    });
  }

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Classes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {classList.length} classes · {classList.filter((c) => c.recurring).length} recurring
            series
          </p>
        </div>
        <Button asChild variant="clay">
          <Link href="/dashboard/classes/new">Create class</Link>
        </Button>
      </div>

      {classList.length === 0 ? (
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
          {classList.map((c) => (
            <div key={c.id} className="surface overflow-hidden">
              <img
                src={c.cover}
                alt={c.name}
                loading="lazy"
                width={1200}
                height={800}
                className="h-36 w-full object-cover"
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg">{c.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {c.recurring ?? `${c.date}`} · {c.time} {timezoneLabel(c.timezone)} ·{" "}
                      {c.duration} min
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusPill tone={tone(c.status)}>{c.status}</StatusPill>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="More actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={duplicateAction.pending}
                          onClick={() => handleDuplicate(c)}
                        >
                          <Copy className="size-4" /> Duplicate class
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {c.status !== "cancelled" && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setConfirmTarget({ id: c.id, action: "cancel" })}
                          >
                            <XCircle className="size-4" /> Cancel class
                          </DropdownMenuItem>
                        )}
                        {c.status === "draft" && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setConfirmTarget({ id: c.id, action: "delete" })}
                          >
                            <Trash2 className="size-4" /> Delete class
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <PriceTag
                    price={c.price}
                    originalPrice={c.originalPrice}
                    priceClassName="font-medium"
                  />
                  <span className="text-muted-foreground">
                    {c.booked} / {c.capacity} booked
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-secondary">
                  <div
                    className="h-1.5 rounded-full bg-clay"
                    style={{ width: `${Math.round((c.booked / c.capacity) * 100)}%` }}
                  />
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
          ))}
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
                ? `${confirmClass?.booked ?? 0} booked student${confirmClass?.booked === 1 ? "" : "s"} will be notified and refunded.`
                : "This draft class will be permanently deleted. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              Never mind
            </Button>
            <Button variant="destructive" disabled={statusAction.pending} onClick={handleConfirm}>
              {statusAction.pending
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
