"use client"

import { useEffect, useRef } from "react"

import { Maximize2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import DraggableWebcamPip from "./DraggableWebcamPip"
import RecorderShell from "../recorderShell"
import CreateAnnouncementRow from "../createAnnouncementRow"
import RecorderToolbar from "../recorderToolbar"

import { RECORDING_TYPE } from "@/constants/recordingTypes"
import { WebcamSizeOptions } from "@/constants/recording"
import { useRecording } from "@/contexts/recordingContext"
import VideoPlayer from "@/core/mediaPlayer/VideoPlayer"
import Icon from "@/designSystem/icon"
import useBlobObjectUrl from "@/hooks/useBlobObjectUrl"
import useLatestRef from "@/hooks/useLatestRef"
import useScreenWithCamRecorder from "@/hooks/recorder/useScreenWithCamRecorder"
import type { WebcamOverlaySize } from "@/types/recording"
import type { ScreenWithWebcamRecorderProps } from "@/types/recorder"

export default function ScreenWithWebcamRecorder({
  muteAudio,
  isMicDisabled,
  selectedAudioDevice,
  selectedVideoDevice,
  recorderSettings,
  setSelectedRecordingOption,
}: ScreenWithWebcamRecorderProps) {
  const tPermissions = useTranslations("permissions")
  const tTitles = useTranslations("recorderTitles")
  const tOverlay = useTranslations("webcamOverlay")
  const { recordingData } = useRecording()
  const compositeContainerRef = useRef<HTMLDivElement>(null)

  const {
    screenRef,
    videoRef,
    compositorWebcamRef,
    canvasRef,
    mediaRecorder,
    mediaStream,
    screenStream,
    cameraStream,
    streamPermissionDenied,
    isRecording,
    formattedTimer,
    recordTimer,
    countdownRemaining,
    countDownStatus,
    isPaused,
    isStopped,
    isFinalizing,
    recordBlob,
    setRecordBlob,
    setRecordTimer,
    setIsStopped,
    playerReady,
    setPlayerReady,
    webcamOverlay,
    setWebcamOverlay,
    showCompositePreview,
    recorderStart,
    recorderPause,
    recorderResume,
    recorderStop,
    downloadRecording,
    onCancelRecordingInit,
    initScreenStream,
  } = useScreenWithCamRecorder({
    selectedAudioDevice,
    selectedVideoDevice,
    recorderSettings,
    muteAudio,
    isMicDisabled,
  })

  const previewObjectUrl = useBlobObjectUrl(recordBlob)

  const initScreenStreamRef = useLatestRef(initScreenStream)
  const selectedAudioDeviceRef = useLatestRef(selectedAudioDevice)

  useEffect(() => {
    initScreenStreamRef.current(selectedAudioDeviceRef.current)
  }, [initScreenStreamRef, selectedAudioDeviceRef])

  useEffect(() => {
    if (!recordingData) return

    setIsStopped(true)
    setRecordBlob(
      recordingData.blob.slice(
        0,
        recordingData.blob.size,
        recordingData.mimeType
      )
    )
    setRecordTimer(recordingData.timer)
  }, [recordingData, setIsStopped, setRecordBlob, setRecordTimer])

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
      headerSlot={
        <div className="recorder__webcam_settings">
          <label className="flex items-center gap-1">
            <Icon icon={Maximize2} size={20} />
            {tOverlay("sizeLabel")}:&nbsp;
            <select
              value={webcamOverlay.size}
              onChange={(e) =>
                setWebcamOverlay((prev) => ({
                  ...prev,
                  size: e.target.value as WebcamOverlaySize,
                }))
              }
              className="focus:ring-opacity-50 rounded-md p-1 px-2 focus:ring-2 focus:ring-slate-500 focus:outline-none"
              aria-label={tOverlay("sizeAria")}
            >
              {WebcamSizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {tOverlay(option.messageKey)}
                </option>
              ))}
            </select>
          </label>
        </div>
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
            queryType={RECORDING_TYPE.SCREEN_VIDEO}
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
        <div ref={compositeContainerRef} className="recorder__composite_live">
          <div
            className="recorder__composite_screen_layer h-full w-full"
            style={{
              opacity: showCompositePreview ? 0 : 1,
              pointerEvents: "none",
            }}
            aria-hidden={showCompositePreview}
          >
            <video
              ref={screenRef}
              autoPlay
              playsInline
              muted
              className="recorder__composite_screen h-full w-full"
              aria-hidden="true"
            />
          </div>
          <canvas
            ref={canvasRef}
            className="recorder__composite_preview h-full w-full"
            style={{ display: showCompositePreview ? "block" : "none" }}
            aria-hidden="true"
          />
          <video
            ref={compositorWebcamRef}
            className="recorder__webcam_compositor_src"
            autoPlay
            playsInline
            muted
            aria-hidden="true"
          />
          {!showCompositePreview ? (
            <DraggableWebcamPip
              containerRef={compositeContainerRef}
              screenVideoRef={screenRef}
              videoRef={videoRef}
              cameraStream={cameraStream}
              placement={webcamOverlay}
              onPlacementChange={setWebcamOverlay}
              mirror={recorderSettings.mirror}
            />
          ) : null}
        </div>
      }
    />
  )
}
