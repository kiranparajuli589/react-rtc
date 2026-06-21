import { useCallback, useRef } from "react"

import ConsoleLogger from "@/helpers/consoleLogger"

type UseRecorderStreamArgs = {
  mediaStreamRef: React.RefObject<MediaStream | null>
  setMediaStream: React.Dispatch<React.SetStateAction<MediaStream | null>>
}

export default function useRecorderStream({
  mediaStreamRef,
  setMediaStream,
}: UseRecorderStreamArgs) {
  const clearMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      setMediaStream(null)
      mediaStreamRef.current = null
    }
  }, [mediaStreamRef, setMediaStream])

  return { clearMediaStream }
}

export function useMediaStreamRef() {
  const mediaStreamRef = useRef<MediaStream | null>(null)
  return mediaStreamRef
}

export function stopAllTracks(stream: MediaStream | null): void {
  if (!stream) return
  stream.getTracks().forEach((track) => {
    track.stop()
    ConsoleLogger.info("Stopped track", {
      kind: track.kind,
      label: track.label,
    })
  })
}
