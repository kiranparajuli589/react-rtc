"use client"

import { useCallback, useEffect, useLayoutEffect, useRef } from "react"

import { useTranslations } from "next-intl"
import { toast } from "sonner"

import RecorderShell from "../recorderShell"
import CreateAnnouncementRow from "../createAnnouncementRow"
import RecorderToolbar from "../recorderToolbar"

import { RECORDING_TYPE } from "@/constants/recordingTypes"
import { useRecording } from "@/contexts/recordingContext"
import AudioPlayer from "@/core/mediaPlayer/AudioPlayer"
import { requestNotificationPermission } from "@/hooks/desktopNotification"
import useAudioVisualizer from "@/hooks/useAudioVisualizer"
import useLatestRef from "@/hooks/useLatestRef"
import useMediaRecorder from "@/hooks/useMediaRecorder"
import useOnUnmount from "@/hooks/useOnUnmount"
import usePreviewReady from "@/hooks/usePreviewReady"
import useStream from "@/hooks/useStream"
import type { AudioRecorderProps } from "@/types/recorder"

export default function AudioRecorder({
  selectedAudioDevice,
  setSelectedRecordingOption,
  recorderSettings,
}: AudioRecorderProps) {
  const tPermissions = useTranslations("permissions")
  const tTitles = useTranslations("recorderTitles")
  const { recordingData } = useRecording()

  const {
    isPermissionDenied: streamPermissionDenied,
    initAudioStream,
    clearStream,
    micStream,
    audioRef,
  } = useStream()

  const resetPlayerReadyRef = useRef(() => {})

  const reinitializeStreams = useCallback(() => {
    resetPlayerReadyRef.current()
    clearStream()
    initAudioStream(selectedAudioDevice, recorderSettings.quality)
  }, [
    clearStream,
    initAudioStream,
    selectedAudioDevice,
    recorderSettings.quality,
  ])

  const {
    setMediaStream,
    mediaStream,
    mediaRecorder,
    isRecording,
    isPaused,
    isStopped,
    clearMediaRecorder,
    recorderStart,
    recorderPause,
    recorderResume,
    recorderStop,
    downloadRecording,
    formattedTimer,
    countdownRemaining,
    countDownStatus,
    isFinalizing,
    recordBlob,
    recordTimer,
    setIsStopped,
    setRecordBlob,
    setRecordTimer,
    onCancelRecordingInit,
  } = useMediaRecorder({
    type: RECORDING_TYPE.AUDIO,
    withCountdown: recorderSettings.countDown,
    clearStream,
    reinitializeStreams,
    quality: recorderSettings.quality,
  })

  const { playerReady, setPlayerReady } = usePreviewReady(recordBlob)

  useLayoutEffect(() => {
    resetPlayerReadyRef.current = () => setPlayerReady(false)
  })

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

  useEffect(() => {
    if (streamPermissionDenied) {
      setSelectedRecordingOption(null)
      toast.error(tPermissions("microphoneDenied"))
    }
  }, [streamPermissionDenied, setSelectedRecordingOption, tPermissions])

  useEffect(() => {
    if (!recordingData?.blob && selectedAudioDevice && !isStopped) {
      initAudioStream(selectedAudioDevice, recorderSettings.quality)
    }
  }, [
    selectedAudioDevice,
    isStopped,
    recordingData?.blob,
    initAudioStream,
    recorderSettings.quality,
  ])

  useEffect(() => {
    if (micStream) {
      setMediaStream(micStream)
    }
  }, [micStream, setMediaStream])

  const clearStreamRef = useLatestRef(clearStream)
  const clearMediaRecorderRef = useLatestRef(clearMediaRecorder)

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  useOnUnmount(() => {
    clearStreamRef.current()
    clearMediaRecorderRef.current()
  })

  useEffect(() => {
    if (isRecording) {
      document.title = tTitles("audioRecording", { time: formattedTimer })
    } else {
      document.title = tTitles("audio")
    }
  }, [formattedTimer, isRecording, tTitles])

  const { visualizerCanvasRef, initAudioContext, visualizerConfig } =
    useAudioVisualizer()

  useEffect(() => {
    if (micStream) {
      initAudioContext(micStream)
    }
  }, [micStream, initAudioContext])

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
      isStreamReady={Boolean(micStream)}
      previewVariant="audio"
      previewContent={
        <div className="after-recording">
          <CreateAnnouncementRow
            isPlayerReady={playerReady}
            className="justify-center"
            recordBlob={recordBlob}
            recordTimer={recordTimer}
            type={RECORDING_TYPE.AUDIO}
            queryType={RECORDING_TYPE.AUDIO}
          />
          <AudioPlayer
            className="mx-auto max-w-[700px]"
            src={recordBlob}
            duration={recordTimer}
            onComponentReady={() => setPlayerReady(true)}
          />
        </div>
      }
      livePreview={
        <>
          <canvas
            ref={visualizerCanvasRef}
            className="recorder__audio_visualizer"
            width={
              typeof window !== "undefined"
                ? Math.min(window.innerWidth * 0.8, 900)
                : 900
            }
            height={400}
            style={{ backgroundColor: visualizerConfig.bgColor }}
            aria-hidden="true"
          />
          <audio ref={audioRef} className="sr-only" aria-hidden="true" />
        </>
      }
      skeletonHeight="100%"
    />
  )
}
