"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Stale-while-revalidate for pages: a revisited page renders instantly from the
 * client cache, then this quietly refetches it. router.refresh() never shows a
 * loading skeleton; the UI only changes if the server data actually changed.
 * First visits are already fresh, so they are not refetched.
 */
export function RevalidateOnRevisit() {
  const pathname = usePathname();
  const router = useRouter();
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (seen.current.has(pathname)) router.refresh();
    else seen.current.add(pathname);
  }, [pathname, router]);

  return null;
}
