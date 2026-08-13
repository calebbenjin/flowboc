"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { ClassForm } from "@/components/ClassForm";
import { useMockAction } from "@/hooks/use-mock-action";

export function NewClassClient() {
  const router = useRouter();
  const { pending, run } = useMockAction();

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard/classes" className="text-sm text-muted-foreground hover:text-clay">
          ← Back to classes
        </Link>
        <h1 className="mt-3 text-3xl">Create a class</h1>

        <ClassForm
          primaryLabel="Publish class"
          secondaryLabel="Save as draft"
          pending={pending}
          onSubmit={(e) => {
            e.preventDefault();
            run({
              success: "Class published",
              onDone: () => router.push("/dashboard/classes"),
            });
          }}
        />
      </div>
    </DashboardShell>
  );
}
