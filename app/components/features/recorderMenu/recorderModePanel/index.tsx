import dynamic from "next/dynamic"

import { RECORDING_TYPE } from "@/constants/recordingTypes"
import type { RecorderModePanelProps } from "@/types/recorder"

import RecorderModeSkeleton from "./RecorderModeSkeleton"

const AudioRecorder = dynamic(() => import("../audioRecorder"), {
  loading: () => <RecorderModeSkeleton variant="audio" />,
})
const ScreenRecorder = dynamic(() => import("../screenRecorder"), {
  loading: () => <RecorderModeSkeleton />,
})
const VideoRecorder = dynamic(() => import("../videoRecorder"), {
  loading: () => <RecorderModeSkeleton />,
})
const ScreenWithWebcamRecorder = dynamic(
  () => import("../screenWithWebcamRecorder"),
  { loading: () => <RecorderModeSkeleton /> }
)

/** Routes to the active recording mode UI (camera, audio, screen, or screen + camera). */
export default function RecorderModePanel(props: RecorderModePanelProps) {
  const {
    type,
    muteAudio,
    selectedAudioDevice,
    selectedVideoDevice,
    setSelectedRecordingOption,
    recorderSettings,
    isMicDisabled,
    devicesList,
  } = props

  return (
    <div className="recorder">
      {type === RECORDING_TYPE.AUDIO && (
        <AudioRecorder
          selectedAudioDevice={selectedAudioDevice}
          recorderSettings={recorderSettings}
          setSelectedRecordingOption={setSelectedRecordingOption}
        />
      )}
      {type === RECORDING_TYPE.SCREEN && (
        <ScreenRecorder
          muteAudio={muteAudio}
          isMicDisabled={isMicDisabled}
          selectedAudioDevice={selectedAudioDevice}
          recorderSettings={recorderSettings}
          setSelectedRecordingOption={setSelectedRecordingOption}
        />
      )}
      {type === RECORDING_TYPE.VIDEO && (
        <VideoRecorder
          muteAudio={muteAudio}
          isMicDisabled={isMicDisabled}
          selectedAudioDevice={selectedAudioDevice}
          selectedVideoDevice={selectedVideoDevice}
          recorderSettings={recorderSettings}
          setSelectedRecordingOption={setSelectedRecordingOption}
          devicesList={devicesList}
        />
      )}
      {type === RECORDING_TYPE.SCREEN_VIDEO && (
        <ScreenWithWebcamRecorder
          muteAudio={muteAudio}
          isMicDisabled={isMicDisabled}
          selectedAudioDevice={selectedAudioDevice}
          selectedVideoDevice={selectedVideoDevice}
          recorderSettings={recorderSettings}
          setSelectedRecordingOption={setSelectedRecordingOption}
        />
      )}
    </div>
  )
}
