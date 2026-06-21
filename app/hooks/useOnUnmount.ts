import { useEffect } from "react"

import useLatestRef from "@/hooks/useLatestRef"

/** Runs cleanup on unmount with the latest callback (avoids stale closures). */
export default function useOnUnmount(cleanup: () => void) {
  const cleanupRef = useLatestRef(cleanup)

  useEffect(() => {
    const ref = cleanupRef
    return () => {
      ref.current()
    }
  }, [cleanupRef])
}
