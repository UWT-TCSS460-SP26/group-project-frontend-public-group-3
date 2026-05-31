import { useSyncExternalStore } from "react";

/** True only in the browser — server and pre-hydration client both see `false`. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}
