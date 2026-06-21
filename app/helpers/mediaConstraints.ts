import { BrowserDictionary, getBrowserName, isMobile } from "./browserHelper"

import { getQualityPreset } from "@/constants/recording"
import ConsoleLogger from "@/helpers/consoleLogger"
import type { Quality } from "@/types/recording"

/** Screen-capture options including non-standard, browser-specific fields. */
type DisplayCaptureOptions = DisplayMediaStreamOptions & {
  preferCurrentTab?: boolean
  selfBrowserSurface?: string
  systemAudio?: string
  surfaceSwitching?: string
  monitorTypeSurfaces?: string
  cursor?: string
}

export const getAudioConstraints = (
  deviceId: string | null,
  quality?: Quality | null
): MediaStreamConstraints => {
  if (deviceId === null) {
    return { audio: true }
  }

  const supports = navigator.mediaDevices.getSupportedConstraints()
  ConsoleLogger.info("Supported constraints: ", supports)

  const { sampleRate, channelCount } = getQualityPreset(quality).audio
  const audio: MediaTrackConstraints = { deviceId }

  if (supports.channelCount) audio.channelCount = channelCount
  if (supports.sampleRate) audio.sampleRate = sampleRate

  if (isMobile()) {
    return { audio, video: false }
  }

  if (deviceId === "PureAudio") {
    delete audio.deviceId
    if (supports.autoGainControl) audio.autoGainControl = true
    if (supports.echoCancellation) audio.echoCancellation = true
    if (supports.noiseSuppression) audio.noiseSuppression = true
    return { audio, video: false }
  }

  if (supports.autoGainControl) audio.autoGainControl = false
  if (getBrowserName() !== BrowserDictionary.Safari) {
    audio.echoCancellation = false
  }
  if (supports.noiseSuppression) audio.noiseSuppression = false

  return { audio, video: false }
}

type VideoConstraintsArgs = {
  deviceId: string | null
  aspectRatio?: number
  isBackCamera?: boolean
  quality?: Quality | null
}

export const getVideoConstraints = ({
  deviceId,
  aspectRatio,
  isBackCamera,
  quality,
}: VideoConstraintsArgs): MediaStreamConstraints => {
  if (deviceId === null) {
    return { video: true }
  }

  const videoSettings: MediaTrackConstraints = {
    deviceId: { ideal: deviceId },
    facingMode: isBackCamera ? "environment" : "user",
    aspectRatio: { ideal: aspectRatio },
    frameRate: { ideal: 60 },
  }

  if (isMobile()) {
    return { video: videoSettings }
  }

  const { width: recordingWidth, height: recordingHeight } =
    getQualityPreset(quality).camera

  return {
    video: {
      ...videoSettings,
      // Use `ideal` (not exact min/max) so cameras that can't hit the target
      // resolution degrade to their closest mode instead of throwing
      // OverconstrainedError. `max` keeps it from overshooting the preset.
      width: { ideal: recordingWidth, max: recordingWidth },
      height: { ideal: recordingHeight, max: recordingHeight },
    },
  }
}

export const getOverlayCameraConstraints = (
  deviceId: string | null,
  quality?: Quality | null
): MediaStreamConstraints => {
  const { width, height } = getQualityPreset(quality).overlayCamera

  return {
    video: {
      deviceId: deviceId ? { ideal: deviceId } : undefined,
      width: { ideal: width, max: width },
      height: { ideal: height, max: height },
      aspectRatio: { ideal: 1 },
      frameRate: { ideal: 30, max: 30 },
    },
    audio: false,
  }
}

export const displayMediaOptions = (
  audioDeviceId: string | null,
  quality?: Quality | null
): DisplayCaptureOptions => {
  const audioConstraints = getAudioConstraints(audioDeviceId, quality)
  const supports = navigator.mediaDevices.getSupportedConstraints()

  const { maxWidth, maxHeight, frameRate } = getQualityPreset(quality).screen
  const video: MediaTrackConstraints & { displaySurface?: string } = {
    frameRate: { ideal: frameRate, max: frameRate },
  }
  // Only cap resolution when the preset asks for it — high quality keeps native size.
  if (maxWidth) video.width = { max: maxWidth }
  if (maxHeight) video.height = { max: maxHeight }
  if (supports.displaySurface) video.displaySurface = "browser"

  return {
    video,
    audio: audioConstraints.audio,
    preferCurrentTab: false,
    selfBrowserSurface: "exclude",
    systemAudio: "include",
    surfaceSwitching: "include",
    monitorTypeSurfaces: "include",
    cursor: "always",
  }
}
