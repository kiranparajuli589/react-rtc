import type { Dispatch, SetStateAction } from "react"

import type { RecordingType } from "@/constants/recordingTypes"
import type { DevicesList, RecorderSettings } from "./recording"

export type SetSelectedRecordingOption = Dispatch<
  SetStateAction<RecordingType | null>
>

/** Controls + state shared by every recorder's toolbar. */
export type RecorderToolbarProps = {
  setSelectedRecordingOption: SetSelectedRecordingOption
  mediaRecorder: MediaRecorder | null
  isRecording: boolean
  isPaused: boolean
  isStopped: boolean
  recorderStart: (fromClick?: boolean) => void
  recorderPause: () => void
  recorderResume: () => void
  recorderStop: (limitReached?: boolean) => void
  downloadRecording: () => void
  formattedTimer: string
  recordTimer: number
  countDownStatus: boolean | null
  /** True when capture stream is ready; Start must not require MediaRecorder (canvas modes defer setup). */
  isStreamReady: boolean
}

export type CreateAnnouncementRowProps = {
  isPlayerReady: boolean
  recordBlob: Blob | null
  recordTimer: number
  type: RecordingType
  queryType: RecordingType
  className?: string
}

export type AudioRecorderProps = {
  selectedAudioDevice: string | null
  setSelectedRecordingOption: SetSelectedRecordingOption
  recorderSettings: RecorderSettings
}

export type VideoRecorderProps = {
  muteAudio: boolean
  selectedVideoDevice: string | null
  selectedAudioDevice: string | null
  setSelectedRecordingOption: SetSelectedRecordingOption
  recorderSettings: RecorderSettings
  isMicDisabled: boolean
  devicesList: DevicesList
}

export type ScreenRecorderProps = {
  muteAudio: boolean
  isMicDisabled: boolean
  selectedAudioDevice: string | null
  setSelectedRecordingOption: SetSelectedRecordingOption
  recorderSettings: RecorderSettings
}

export type ScreenWithWebcamRecorderProps = {
  muteAudio: boolean
  isMicDisabled: boolean
  selectedAudioDevice: string | null
  selectedVideoDevice: string | null
  recorderSettings: RecorderSettings
  setSelectedRecordingOption: SetSelectedRecordingOption
}

export type RecorderModePanelProps = {
  type: RecordingType
  muteAudio: boolean
  selectedAudioDevice: string | null
  selectedVideoDevice: string | null
  setSelectedRecordingOption: SetSelectedRecordingOption
  recorderSettings: RecorderSettings
  isMicDisabled: boolean
  devicesList: DevicesList
}

export type RecordingActionsProps = {
  disabled: RecordingType | null
  selectedVideoDevice: string | null
  selectedAudioDevice: string | null
  setSelectedAudioDevice: Dispatch<SetStateAction<string | null>>
  setSelectedVideoDevice: Dispatch<SetStateAction<string | null>>
  setIsMicDisabled: Dispatch<SetStateAction<boolean>>
  setIsCameraDisabled: Dispatch<SetStateAction<boolean>>
  setRecorderSettings: Dispatch<SetStateAction<RecorderSettings>>
  setIsRequestingPermissions: Dispatch<SetStateAction<boolean>>
  selectedRecordingOption: RecordingType | null
  setDevicesList: Dispatch<SetStateAction<DevicesList>>
}
