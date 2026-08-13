import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface flex flex-col items-center gap-1 p-10 text-center", className)}>
      <span className="mb-2 grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="font-medium">{title}</p>
      {body ? <p className="max-w-sm text-sm text-muted-foreground">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
