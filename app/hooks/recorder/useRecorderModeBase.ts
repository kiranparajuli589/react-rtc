import { useEffect } from "react"

import { requestNotificationPermission } from "../desktopNotification"
import useMediaRecorder from "../useMediaRecorder"
import useStream from "../useStream"

import type { RecordingType } from "@/constants/recordingTypes"
import useOnUnmount from "@/hooks/useOnUnmount"
import usePreviewReady from "@/hooks/usePreviewReady"
import type { RecorderSettings } from "@/types/recording"

type UseRecorderModeBaseArgs = {
  recordingType: RecordingType
  recorderSettings: RecorderSettings
  clearStream: () => void
  reinitializeStreams: () => void
  isMicDisabled: boolean
  canvasCaptureFrameRate?: number
}

/** Shared wiring for mode-specific recorder hooks. */
export default function useRecorderModeBase({
  recordingType,
  recorderSettings,
  clearStream,
  reinitializeStreams,
  isMicDisabled,
  canvasCaptureFrameRate,
}: UseRecorderModeBaseArgs) {
  const mediaRecorder = useMediaRecorder({
    type: recordingType,
    withCountdown: recorderSettings.countDown,
    clearStream,
    reinitializeStreams,
    isMicDisabled,
    canvasCaptureFrameRate,
  })

  const { playerReady, setPlayerReady } = usePreviewReady(mediaRecorder.recordBlob)

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  useOnUnmount(() => {
    clearStream()
    mediaRecorder.clearMediaRecorder()
  })

  return {
    playerReady,
    setPlayerReady,
    ...mediaRecorder,
  }
}

export function useStreamWithCleanup() {
  const stream = useStream()

  const clearStreamAndRefs = () => {
    stream.clearStream()
  }

  return { ...stream, clearStream: clearStreamAndRefs }
}
