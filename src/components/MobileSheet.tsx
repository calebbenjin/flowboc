"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

// Bottom sheet for the dashboard's phone layouts: row details and action
// menus open here instead of in dropdowns, which are hard to hit with a thumb.
export function MobileSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="mx-auto max-h-[85dvh] max-w-lg bg-white">
        <DrawerHeader className="px-5 pb-2 text-left">
          <DrawerTitle className="text-lg font-medium">{title}</DrawerTitle>
          {description ? (
            <DrawerDescription>{description}</DrawerDescription>
          ) : (
            <DrawerDescription className="sr-only">Details and actions</DrawerDescription>
          )}
        </DrawerHeader>
        <div
          className="overflow-y-auto px-5 pb-5"
          style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// A large, full-width tappable row for action lists inside a MobileSheet.
// Links reuse the same look through `sheetActionClass`.
export const sheetActionClass =
  "flex min-h-13 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.95rem] transition-colors active:bg-secondary disabled:opacity-50";

export function SheetAction({
  icon,
  children,
  destructive = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        sheetActionClass,
        destructive ? "text-destructive" : "text-foreground",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
