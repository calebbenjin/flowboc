"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import posthog from "posthog-js";
import { SessionActivity } from "@/components/SessionActivity";

function PostHogSessionIdentity() {
  const { data: session, status } = useSession();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (
      status === "loading" ||
      !process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] ||
      !process.env["NEXT_PUBLIC_POSTHOG_HOST"]
    ) {
      return;
    }

    const user = session?.user;
    const persistedUserId = posthog.get_property("$user_id");
    const currentUserId = identifiedUserId.current ?? persistedUserId;

    if (!user) {
      if (currentUserId) {
        posthog.reset();
        identifiedUserId.current = null;
      }
      return;
    }

    if (currentUserId === user.id) {
      identifiedUserId.current = user.id;
      return;
    }

    if (currentUserId) posthog.reset();

    posthog.identify(user.id, {
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      role: user.role,
    });
    identifiedUserId.current = user.id;
  }, [session, status]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus refetchWhenOffline={false}>
      <SessionActivity />
      <PostHogSessionIdentity />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
