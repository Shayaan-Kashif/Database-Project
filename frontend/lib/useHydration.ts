"use client";

import { useState, useEffect, useLayoutEffect } from "react";

export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  // React 19 warning fix:
  // useLayoutEffect only runs in browser and is synchronous before paint.
  const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

  useIsoLayoutEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
