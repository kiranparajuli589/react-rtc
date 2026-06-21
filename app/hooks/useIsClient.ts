import { useSyncExternalStore } from "react"

/** True after the component has mounted on the client (safe for hydration-sensitive UI). */
export function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}
