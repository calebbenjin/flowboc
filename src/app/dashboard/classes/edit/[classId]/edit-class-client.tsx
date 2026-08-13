"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { ClassForm } from "@/components/ClassForm";
import { classById } from "@/lib/demo";
import { useMockAction } from "@/hooks/use-mock-action";

export function EditClassClient({ classId }: { classId: string }) {
  const cls = classById(classId);
  if (!cls) notFound();

  const router = useRouter();
  const { pending, run } = useMockAction();

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/dashboard/classes/${classId}`}
          className="text-sm text-muted-foreground hover:text-clay"
        >
          ← Back to class
        </Link>
        <h1 className="mt-3 text-3xl">Edit class</h1>

        <ClassForm
          initial={cls}
          primaryLabel="Save changes"
          secondaryLabel="Cancel"
          pending={pending}
          onSecondary={() => router.push(`/dashboard/classes/${classId}`)}
          onSubmit={(e) => {
            e.preventDefault();
            run({
              success: "Class updated",
              onDone: () => router.push(`/dashboard/classes/${classId}`),
            });
          }}
        />
      </div>
    </DashboardShell>
  );
}
