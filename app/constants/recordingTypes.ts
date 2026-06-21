export const RECORDING_TYPE = {
  VIDEO: "VIDEO",
  AUDIO: "AUDIO",
  SCREEN: "SCREEN",
  SCREEN_VIDEO: "SCREENVIDEO",
} as const

export type RecordingType = (typeof RECORDING_TYPE)[keyof typeof RECORDING_TYPE]
