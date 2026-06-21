import type { LucideIcon } from "lucide-react";

import type { RecordingType } from "@/constants/recordingTypes";

/**
 * A recording produced by any recorder (audio / video / screen / screen+cam).
 * `null` means there is no recording yet.
 */
export type RecordingData = {
  blob: Blob;
  type: RecordingType;
  timer: number;
  mimeType?: string;
  file?: File;
} | null;

export type Quality = "medium" | "high";

export type AspectRatio = "16:9" | "1:1" | "4:5" | "9:16";

export type WebcamOverlaySize = "xs" | "sm" | "md" | "lg" | "xl";

/** Normalized webcam circle placement within the screen content area (0–1). */
export type WebcamOverlayPlacement = {
  centerX: number;
  centerY: number;
  size: WebcamOverlaySize;
};

/** User-tunable recorder behaviour, surfaced through the settings dropdown. */
export type RecorderSettings = {
  countDown: boolean;
  mirror: boolean;
  quality?: Quality;
};

/** A selectable input device. Includes synthetic entries (e.g. "PureAudio"). */
export type RecordingDevice = {
  deviceId: string;
  label: string;
  kind?: MediaDeviceKind;
};

export type DevicesList = {
  audioDevices: RecordingDevice[];
  videoDevices: RecordingDevice[];
};

/** A card shown on the recorder landing menu. */
export type RecordingMenuOption = {
  title: string;
  icon: LucideIcon;
  disabledIcon: LucideIcon;
  type: RecordingType;
  subtitle: string;
  messageKey: "camera" | "audio" | "screen" | "screenVideo";
};

export type MimeTypeInfo = {
  mimeType: string | null;
  fileExtension: string;
};
