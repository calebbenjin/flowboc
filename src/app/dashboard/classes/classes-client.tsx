"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Copy, Loader2, MoreHorizontal, Trash2, XCircle } from "lucide-react";
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

export function ClassesClient({ classes }: { classes: YogaClass[] }) {
  const router = useRouter();
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const seriesCount = new Set(classes.filter((c) => c.seriesId).map((c) => c.seriesId)).size;

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
          {classes.map((c) => (
            <div key={c.id} className="surface overflow-hidden">
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="More actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={duplicatingId === c.id}
                          onClick={() => void handleDuplicate(c)}
                        >
                          {duplicatingId === c.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                          Duplicate class
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {c.status !== "CANCELLED" && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setConfirmTarget({ id: c.id, action: "cancel" })}
                          >
                            <XCircle className="size-4" /> Cancel class
                          </DropdownMenuItem>
                        )}
                        {c.status === "DRAFT" && (
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
                    originalPrice={c.originalPrice ?? undefined}
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
