"use client"

import { useEffect, useRef } from "react"

import {
  Circle,
  Download,
  Pause,
  Play,
  RefreshCcwDot,
  Trash2,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { BackButton, RecorderActionButton } from "../buttonItems"

import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import Config from "@/config"
import { useConfirm } from "@/contexts/confirmDialogContext"
import { useRecording } from "@/contexts/recordingContext"
import { formatTime } from "@/core/mediaPlayer/utils"
import { BrowserDictionary, getBrowserName } from "@/helpers/browserHelper"
import { cn } from "@/lib/utils"
import type { RecorderToolbarProps } from "@/types/recorder"

export default function RecorderToolbar({
  setSelectedRecordingOption,
  mediaRecorder,
  isRecording,
  isPaused,
  isStopped,
  recorderStart,
  recorderPause,
  recorderResume,
  recorderStop,
  downloadRecording,
  formattedTimer,
  recordTimer,
  countDownStatus,
  isStreamReady,
}: RecorderToolbarProps) {
  const confirm = useConfirm()
  const tCommon = useTranslations("common")
  const tToolbar = useTranslations("toolbar")
  const { recordingData, setRecordingData } = useRecording()
  const liveRegionRef = useRef<HTMLDivElement>(null)
  const lastAnnouncedMinuteRef = useRef(-1)

  const isRestartAtPreview = isStopped && !isRecording
  const isStartDisabled = isRestartAtPreview
    ? !!countDownStatus
    : !isStreamReady || isRecording || !!countDownStatus

  const statusLabel = (() => {
    if (isRecording && isPaused) return tCommon("paused")
    if (isRecording) return tCommon("recording")
    if (isStopped) return tCommon("stopped")
    return tCommon("ready")
  })()

  useEffect(() => {
    if (!liveRegionRef.current) return
    liveRegionRef.current.textContent = tToolbar("statusAnnouncement", {
      status: statusLabel,
      time: formattedTimer,
    })
  }, [statusLabel, formattedTimer, tToolbar])

  useEffect(() => {
    if (!isRecording || isPaused) return
    const minute = Math.floor(recordTimer / 60)
    if (minute > 0 && minute !== lastAnnouncedMinuteRef.current) {
      lastAnnouncedMinuteRef.current = minute
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent =
          minute === 1
            ? tToolbar("minuteElapsed", { count: minute })
            : tToolbar("minutesElapsed", { count: minute })
      }
    }
  }, [recordTimer, isRecording, isPaused, tToolbar])

  useEffect(() => {
    if (!isStreamReady || isRecording || isStopped || !liveRegionRef.current)
      return
    liveRegionRef.current.textContent = tToolbar("cameraActive")
  }, [isStreamReady, isRecording, isStopped, tToolbar])

  const startRecording = async () => {
    if (recordingData?.blob) {
      const ok = await confirm({
        title: tToolbar("discardTitle"),
        description: tToolbar("discardDescription"),
        confirmLabel: tCommon("discard"),
        cancelLabel: tToolbar("keepRecording"),
        destructive: true,
      })
      if (!ok) return
      setRecordingData(null)
    }

    if (isRestartAtPreview) {
      const ok = await confirm({
        title: tToolbar("restartTitle"),
        description: tToolbar("restartDescription"),
        confirmLabel: tToolbar("restartConfirm"),
        cancelLabel: tToolbar("keepRecording"),
        destructive: true,
      })
      if (!ok) return
      recorderStart(true)
      return
    }

    recorderStart(true)
  }

  const clearSavedRecording = async () => {
    const ok = await confirm({
      title: tToolbar("clearTitle"),
      description: tToolbar("clearDescription"),
      confirmLabel: tCommon("clear"),
      cancelLabel: tCommon("cancel"),
      destructive: true,
    })
    if (!ok) return
    setRecordingData(null)
  }

  const minimumRecordingLengthInSeconds = 1

  return (
    <div className="recorder_menu__toolbar">
      <div
        ref={liveRegionRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      <BackButton
        onClick={() => {
          setSelectedRecordingOption(null)
          setRecordingData(null)
        }}
        isBlobAvailable={!!recordingData?.blob}
      />

      {(isRecording || isStopped) && (
        <div className="recorder_menu__toolbar__timer">
          <span
            className={`record-dot ${isRecording ? "blinking" : ""}`}
            aria-hidden="true"
          />
          <span className="sr-only">{statusLabel}</span>
          <span
            aria-hidden="true"
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            {statusLabel}
          </span>
          <div className="flex items-center gap-1">
            <span className="recorder_menu__toolbar__timer__status">
              {formattedTimer}
            </span>
            <span className="recorder_menu__toolbar__timer__slash">/</span>
            <span className="recorder_menu__toolbar__timer__limit">
              {formatTime(Config.RECORD_TIME_LIMIT_IN_SEC)}
            </span>
          </div>
        </div>
      )}

      <div className="recorder_menu__toolbar__actions">
        <LanguageToggle />
        <ThemeToggle />
        {recordingData?.blob && (
          <RecorderActionButton
            icon={Trash2}
            label={tCommon("clear")}
            title={tToolbar("clearSaved")}
            onClick={() => void clearSavedRecording()}
          />
        )}
        {isStopped && (
          <RecorderActionButton
            icon={Download}
            label={tCommon("download")}
            title={tToolbar("downloadRecording")}
            onClick={() => downloadRecording()}
          />
        )}
        {isRecording && !isPaused && (
          <RecorderActionButton
            icon={Pause}
            label={tCommon("pause")}
            disabled={!mediaRecorder || !isRecording}
            className="pause_recording_button"
            title={tToolbar("pauseRecording")}
            onClick={() => recorderPause()}
          />
        )}
        {isPaused && (
          <RecorderActionButton
            icon={Play}
            label={tCommon("resume")}
            disabled={!mediaRecorder || !isPaused}
            className="resume_recording_button"
            title={tToolbar("resumeRecording")}
            onClick={() => recorderResume()}
          />
        )}
        {isRecording && (
          <RecorderActionButton
            icon={Circle}
            label={tCommon("stop")}
            disabled={
              !mediaRecorder ||
              !isRecording ||
              recordTimer < minimumRecordingLengthInSeconds
            }
            className="stop_recording_button"
            title={
              isRecording && recordTimer <= minimumRecordingLengthInSeconds
                ? tToolbar("stopMinLength")
                : tToolbar("stopRecording")
            }
            onClick={() => recorderStop()}
          />
        )}
        {!isRecording && (
          <RecorderActionButton
            icon={isStopped ? RefreshCcwDot : Circle}
            label={
              countDownStatus
                ? tCommon("starting")
                : isStopped
                  ? tCommon("restart")
                  : tCommon("start")
            }
            disabled={isStartDisabled}
            className={cn(
              isStopped ? "restart_recording_button" : "start_recording_button",
              !isStopped &&
                getBrowserName() !== BrowserDictionary.Safari &&
                "animate-pulse"
            )}
            title={
              isRestartAtPreview
                ? tToolbar("restartTitle")
                : countDownStatus
                  ? tToolbar("waitCountdown")
                  : tToolbar("startRecording")
            }
            onClick={() => void startRecording()}
          />
        )}
      </div>
    </div>
  )
}
