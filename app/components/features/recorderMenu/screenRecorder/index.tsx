"use client"

import { useEffect } from "react"

import { useTranslations } from "next-intl"
import { toast } from "sonner"

import RecorderShell from "../recorderShell"
import CreateAnnouncementRow from "../createAnnouncementRow"
import RecorderToolbar from "../recorderToolbar"

import { RECORDING_TYPE } from "@/constants/recordingTypes"
import { useRecording } from "@/contexts/recordingContext"
import VideoPlayer from "@/core/mediaPlayer/VideoPlayer"
import useBlobObjectUrl from "@/hooks/useBlobObjectUrl"
import useScreenOnlyRecorder from "@/hooks/recorder/useScreenOnlyRecorder"
import type { ScreenRecorderProps } from "@/types/recorder"

export default function ScreenRecorder(props: ScreenRecorderProps) {
  const {
    muteAudio,
    isMicDisabled,
    selectedAudioDevice,
    setSelectedRecordingOption,
    recorderSettings,
  } = props
  const tPermissions = useTranslations("permissions")
  const tTitles = useTranslations("recorderTitles")

  const { recordingData } = useRecording()

  const {
    screenRef,
    screenStream,
    streamPermissionDenied,
    isRecording,
    formattedTimer,
    recordTimer,
    countdownRemaining,
    countDownStatus,
    isPaused,
    isStopped,
    isFinalizing,
    mediaRecorder,
    mediaStream,
    recordBlob,
    setRecordBlob,
    setRecordTimer,
    setIsStopped,
    recorderStart,
    recorderPause,
    recorderResume,
    recorderStop,
    downloadRecording,
    onCancelRecordingInit,
    playerReady,
    setPlayerReady,
  } = useScreenOnlyRecorder({
    selectedAudioDevice,
    isMicDisabled,
    muteAudio,
    recorderSettings,
  })

  const previewObjectUrl = useBlobObjectUrl(recordBlob)

  useEffect(() => {
    if (streamPermissionDenied) {
      setSelectedRecordingOption(null)
      toast.error(tPermissions("screenDenied"))
    }
  }, [streamPermissionDenied, setSelectedRecordingOption, tPermissions])

  useEffect(() => {
    if (isRecording) {
      document.title = tTitles("screenRecording", { time: formattedTimer })
    } else {
      document.title = tTitles("screen")
    }
  }, [formattedTimer, isRecording, tTitles])

  useEffect(() => {
    if (recordingData) {
      setIsStopped(true)
      setRecordBlob(
        recordingData.blob.slice(
          0,
          recordingData.blob.size,
          recordingData.mimeType
        )
      )
      setRecordTimer(recordingData.timer)
    }
  }, [recordingData, setIsStopped, setRecordBlob, setRecordTimer])

  return (
    <RecorderShell
      toolbar={
        <RecorderToolbar
          setSelectedRecordingOption={setSelectedRecordingOption}
          mediaRecorder={mediaRecorder}
          isRecording={isRecording}
          isPaused={isPaused}
          isStopped={isStopped}
          recorderStart={recorderStart}
          recorderPause={recorderPause}
          recorderResume={recorderResume}
          recorderStop={recorderStop}
          downloadRecording={downloadRecording}
          formattedTimer={formattedTimer}
          recordTimer={recordTimer}
          countDownStatus={countDownStatus}
          isStreamReady={Boolean(mediaStream)}
        />
      }
      countdownRemaining={countdownRemaining}
      countDownStatus={countDownStatus}
      onCancelRecordingInit={onCancelRecordingInit}
      isFinalizing={isFinalizing}
      isStopped={isStopped}
      recordBlob={recordBlob}
      isRecording={isRecording}
      isStreamReady={Boolean(screenStream)}
      previewVariant="video"
      previewContent={
        <>
          <CreateAnnouncementRow
            isPlayerReady={playerReady}
            recordBlob={recordBlob}
            recordTimer={recordTimer}
            type={RECORDING_TYPE.VIDEO}
            queryType={RECORDING_TYPE.SCREEN}
          />
          <VideoPlayer
            src={
              previewObjectUrl
                ? {
                    src: previewObjectUrl,
                    type: recordBlob?.type,
                  }
                : null
            }
            duration={recordTimer}
            onComponentReady={() => setPlayerReady(true)}
          />
        </>
      }
      livePreview={
        <video
          ref={screenRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-contain"
          aria-hidden="true"
        />
      }
    />
  )
}
