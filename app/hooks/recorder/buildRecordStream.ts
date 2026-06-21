import { getAudioContextClass } from "@/helpers/audioContext"

export type BuildRecordStreamArgs = {
  stream: MediaStream
  canvas: HTMLCanvasElement | null
  isMicDisabled: boolean
  canvasCaptureFrameRate: number
}

/**
 * Builds the MediaStream passed to MediaRecorder.
 * Passes audio tracks directly when possible (no AudioContext routing).
 */
export function buildRecordStream({
  stream,
  canvas,
  isMicDisabled,
  canvasCaptureFrameRate,
}: BuildRecordStreamArgs): MediaStream {
  const tracks: MediaStreamTrack[] = []

  if (canvas) {
    tracks.push(...canvas.captureStream(canvasCaptureFrameRate).getTracks())
  } else {
    tracks.push(...stream.getVideoTracks())
  }

  if (!isMicDisabled) {
    tracks.push(...stream.getAudioTracks())
  }

  return new MediaStream(tracks)
}

/** @deprecated AudioContext is only needed for visualizers, not recording. */
export function createAudioContext(): AudioContext {
  return new (getAudioContextClass())()
}
