"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function useUnsavedChanges(
  dirty: boolean,
  message = "Your class changes have not been saved. Stay here to save them, or discard them and leave.",
) {
  const router = useRouter();
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const leavingRef = useRef(false);
  if (!dirty) leavingRef.current = false;
  const [leave, setLeave] = useState<(() => void) | null>(null);
  const confirmLeave = useCallback((action: () => void) => {
    if (dirtyRef.current && !leavingRef.current) setLeave(() => action);
    else action();
  }, []);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirtyRef.current || leavingRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    function linkClick(event: MouseEvent) {
      if (
        !dirtyRef.current ||
        leavingRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download"))
        return;
      const url = new URL(link.href, window.location.href);
      if (!["http:", "https:"].includes(url.protocol)) return;
      if (
        url.href === window.location.href ||
        (url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setLeave(() => () => {
        if (url.origin === window.location.origin)
          router.push(url.pathname + url.search + url.hash);
        else window.location.assign(url.href);
      });
    }
    const currentUrl = window.location.href;
    const currentState = window.history.state;
    function popState(event: PopStateEvent) {
      if (!dirtyRef.current || leavingRef.current || window.location.href === currentUrl) return;
      const destinationUrl = new URL(window.location.href);
      const formUrl = new URL(currentUrl);
      if (destinationUrl.pathname === formUrl.pathname && destinationUrl.search === formUrl.search)
        return;
      event.stopImmediatePropagation();
      const destination = window.location.href;
      // Restore the form URL while the user decides whether to leave.
      window.history.pushState(currentState, "", currentUrl);
      setLeave(() => () => router.replace(destination));
    }
    window.addEventListener("popstate", popState, true);
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", linkClick, true);
    return () => {
      window.removeEventListener("popstate", popState, true);
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", linkClick, true);
    };
  }, [router]);

  const dialog = (
    <AlertDialog
      open={leave !== null}
      onOpenChange={(open) => {
        if (!open) setLeave(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="quiet" onClick={() => setLeave(null)}>
            Keep editing
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              const action = leave;
              leavingRef.current = true;
              setLeave(null);
              action?.();
            }}
          >
            Discard changes
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { confirmLeave, dialog };
}
