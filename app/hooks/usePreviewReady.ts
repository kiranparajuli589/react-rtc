import { useCallback, useState } from "react"

function blobKey(blob: Blob | null | undefined): string | null {
  if (!blob) {
    return null
  }
  return `${blob.size}:${blob.type}`
}

/** Tracks whether the preview player has fired ready for the current record blob. */
export default function usePreviewReady(recordBlob: Blob | null | undefined) {
  const currentBlobKey = blobKey(recordBlob)
  const [readyKey, setReadyKey] = useState<string | null>(null)
  const playerReady = currentBlobKey !== null && readyKey === currentBlobKey

  const setPlayerReady = useCallback(
    (ready: boolean) => {
      setReadyKey(ready && currentBlobKey ? currentBlobKey : null)
    },
    [currentBlobKey]
  )

  return { playerReady, setPlayerReady }
}
