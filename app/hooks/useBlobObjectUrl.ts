import { useEffect, useState } from "react"

function getBlobKey(blob: Blob | null | undefined): string | null {
  if (!blob) {
    return null
  }
  return `${blob.size}:${blob.type}`
}

export default function useBlobObjectUrl(
  blob: Blob | null | undefined
): string | null {
  const blobKey = getBlobKey(blob)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob || !blobKey) {
      queueMicrotask(() => setObjectUrl(null))
      return undefined
    }

    const url = URL.createObjectURL(blob)
    queueMicrotask(() => setObjectUrl(url))

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [blob, blobKey])

  return objectUrl
}
