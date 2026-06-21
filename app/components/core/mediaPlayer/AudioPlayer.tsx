import { useEffect, useRef, useState } from "react"

export type MediaSource = Blob | string | { src: string; type?: string }

function getSrcKey(src: MediaSource | null | undefined): string | null {
  if (src instanceof Blob) {
    return `blob:${src.size}:${src.type}`
  }
  if (typeof src === "string") {
    return src
  }
  if (src?.src) {
    return src.src
  }
  return null
}

type AudioPlayerProps = {
  src: MediaSource | null | undefined
  className?: string
  duration?: number
  onComponentReady?: () => void
}

export default function AudioPlayer({
  src,
  duration,
  onComponentReady = () => {},
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const readyForKeyRef = useRef<string | null>(null)
  const srcKey = getSrcKey(src)
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!srcKey || !src) {
      queueMicrotask(() => setResolvedSrc(null))
      readyForKeyRef.current = null
      return undefined
    }

    let objectUrl: string | null = null

    if (src instanceof Blob) {
      objectUrl = URL.createObjectURL(src)
      queueMicrotask(() => setResolvedSrc(objectUrl))
    } else if (typeof src === "string") {
      queueMicrotask(() => setResolvedSrc(src))
    } else if (typeof src === "object" && "src" in src && src.src) {
      queueMicrotask(() => setResolvedSrc(src.src))
    } else {
      queueMicrotask(() => setResolvedSrc(null))
      return undefined
    }

    readyForKeyRef.current = null

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [srcKey, src])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !resolvedSrc) {
      return undefined
    }

    const getEffectiveDuration = () => {
      if (duration && duration > 0) {
        return duration
      }
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        return audio.duration
      }
      return null
    }

    const handleEnded = () => {
      audio.currentTime = 0
    }

    const handlePlay = () => {
      const effectiveDuration = getEffectiveDuration()
      if (
        effectiveDuration != null &&
        audio.currentTime >= effectiveDuration - 0.1
      ) {
        audio.currentTime = 0
      }
    }

    const handleSeeking = () => {
      const effectiveDuration = getEffectiveDuration()
      if (effectiveDuration != null && audio.currentTime > effectiveDuration) {
        audio.currentTime = effectiveDuration
      }
    }

    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("seeking", handleSeeking)

    return () => {
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("seeking", handleSeeking)
    }
  }, [resolvedSrc, duration])

  const handleReady = () => {
    if (readyForKeyRef.current === srcKey) {
      return
    }
    readyForKeyRef.current = srcKey
    onComponentReady()
  }

  return (
    <audio
      ref={audioRef}
      controls
      style={{ width: "100%" }}
      src={resolvedSrc ?? undefined}
      onLoadedData={handleReady}
      onCanPlay={handleReady}
    />
  )
}
