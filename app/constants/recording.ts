import {
  Clock,
  Mic,
  MicOff,
  MonitorOff,
  MonitorPlay,
  PictureInPicture2,
  RectangleHorizontal,
  RectangleVertical,
  Smartphone,
  Sparkles,
  Square,
  Video,
  VideoOff,
  WebcamOff,
  type LucideIcon,
} from "lucide-react"

import { RECORDING_TYPE } from "@/constants/recordingTypes"
import { StyleVariables } from "@/constants/styleVariables"
import type {
  AspectRatio,
  Quality,
  RecordingMenuOption,
  WebcamOverlayPlacement,
  WebcamOverlaySize,
} from "@/types/recording"

export type RecordingSizeOption = {
  title: string
  ratio: AspectRatio
  icon: LucideIcon
}

export const RecordingSizeOptions: RecordingSizeOption[] = [
  {
    title: "Landscape (16:9)",
    ratio: "16:9",
    icon: RectangleHorizontal,
  },
  {
    title: "Square (1:1)",
    ratio: "1:1",
    icon: Square,
  },
  {
    title: "Portrait (4:5)",
    ratio: "4:5",
    icon: RectangleVertical,
  },
  {
    title: "Tall Portrait (9:16)",
    ratio: "9:16",
    icon: Smartphone,
  },
]

export const RecordingSettingsOptions: { title: string; icon: LucideIcon }[] = [
  { title: "Countdown", icon: Clock },
  { title: "Quality", icon: Sparkles },
  { title: "Mirror Webcam", icon: Smartphone },
]

export const RecordingMenuOptions: Record<
  "Camera" | "Audio" | "Screen" | "ScreenVideo",
  RecordingMenuOption
> = {
  Camera: {
    title: "Camera",
    icon: Video,
    disabledIcon: VideoOff,
    type: RECORDING_TYPE.VIDEO,
    subtitle: "Record your video",
    messageKey: "camera",
  },
  Audio: {
    title: "Audio",
    icon: Mic,
    disabledIcon: MicOff,
    type: RECORDING_TYPE.AUDIO,
    subtitle: "Record your voice",
    messageKey: "audio",
  },
  Screen: {
    title: "Screen",
    icon: MonitorPlay,
    disabledIcon: MonitorOff,
    type: RECORDING_TYPE.SCREEN,
    subtitle: "Record your screen",
    messageKey: "screen",
  },
  ScreenVideo: {
    title: "Screen & Camera",
    icon: PictureInPicture2,
    disabledIcon: WebcamOff,
    type: RECORDING_TYPE.SCREEN_VIDEO,
    subtitle: "Record your screen and camera",
    messageKey: "screenVideo",
  },
}

export const QualityMap: Record<"Medium" | "High", Quality> = {
  Medium: "medium",
  High: "high",
}

/**
 * Single source of truth for how the quality setting maps to each stream.
 * Tweak the numbers here to retune; every recorder mode reads from this map.
 */
export type QualityPreset = {
  /** getDisplayMedia caps. Omit max* to capture the screen at native resolution. */
  screen: { maxWidth?: number; maxHeight?: number; frameRate: number }
  /** Full-frame camera resolution (camera-only mode). */
  camera: { width: number; height: number }
  /** Source resolution for the small circular overlay (screen + camera mode). */
  overlayCamera: { width: number; height: number }
  audio: { sampleRate: number; channelCount: number; bitsPerSecond: number }
  screenVideoBitsPerSecond: number
  cameraVideoBitsPerSecond: number
}

export const QUALITY_PRESETS: Record<Quality, QualityPreset> = {
  medium: {
    screen: { maxWidth: 1280, maxHeight: 720, frameRate: 30 },
    camera: { width: 1280, height: 720 },
    overlayCamera: { width: 480, height: 480 },
    audio: { sampleRate: 44100, channelCount: 2, bitsPerSecond: 128_000 },
    screenVideoBitsPerSecond: 4_000_000,
    cameraVideoBitsPerSecond: 6_000_000,
  },
  high: {
    screen: { frameRate: 30 },
    camera: { width: 1920, height: 1080 },
    overlayCamera: { width: 640, height: 640 },
    audio: { sampleRate: 48000, channelCount: 2, bitsPerSecond: 256_000 },
    screenVideoBitsPerSecond: 8_000_000,
    cameraVideoBitsPerSecond: 10_000_000,
  },
}

export const getQualityPreset = (quality?: Quality | null): QualityPreset =>
  QUALITY_PRESETS[quality ?? "medium"] ?? QUALITY_PRESETS.medium

export const PERMISSION_STATE = {
  GRANTED: "granted",
  PROMPTED: "prompt",
  DENIED: "denied",
  UNKNOWN: "unknown",
} as const

export type PermissionState =
  (typeof PERMISSION_STATE)[keyof typeof PERMISSION_STATE]

export const MEDIA_DEVICE = {
  VIDEO: "camera",
  AUDIO: "microphone",
  SCREEN: "screen",
} as const

export type MediaDeviceType = (typeof MEDIA_DEVICE)[keyof typeof MEDIA_DEVICE]

export const ScreenWebcamConfig = {
  margin: 16,
  borderRadius: 12,
  borderColor: StyleVariables.primary,
  borderWidth: 12,
}

/** Desktop notification nudge messages — sourced from i18n at runtime. */
export const RecordingNudgeMessageKeys = [
  "nudgeReminder",
  "nudgeHello",
] as const

const WEBCAM_SIZE_FRACTIONS: Record<WebcamOverlaySize, number> = {
  xs: 1 / 8,
  sm: 1 / 6,
  md: 1 / 5,
  lg: 1 / 4,
  xl: 1 / 3,
}

export function getWebcamSizeFraction(size: WebcamOverlaySize): number {
  return WEBCAM_SIZE_FRACTIONS[size]
}

export const DEFAULT_WEBCAM_OVERLAY: WebcamOverlayPlacement = {
  centerX: 0.88,
  centerY: 0.88,
  size: "md",
}

export type WebcamSizeOption = {
  value: WebcamOverlaySize
  messageKey: "sizeXs" | "sizeSm" | "sizeMd" | "sizeLg" | "sizeXl"
}

export const WebcamSizeOptions: WebcamSizeOption[] = [
  { value: "xs", messageKey: "sizeXs" },
  { value: "sm", messageKey: "sizeSm" },
  { value: "md", messageKey: "sizeMd" },
  { value: "lg", messageKey: "sizeLg" },
  { value: "xl", messageKey: "sizeXl" },
]
