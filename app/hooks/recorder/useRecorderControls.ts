import { notifyMe } from "../desktopNotification"

import { RECORDING_TYPE, type RecordingType } from "@/constants/recordingTypes"
import {
  resetCanvasPrimedGate,
  waitForCanvasPrimed,
} from "@/helpers/canvasPrimeGate"
import ConsoleLogger from "@/helpers/consoleLogger"
import { getMimeDictionary } from "@/helpers/mimeTypeHelper"
import { getFileFromBlob } from "@/helpers/utils"
import { toast } from "sonner"

import {
  setupRecorder,
  stopActiveRecorder,
  type RecorderSetupContext,
} from "./useRecorderSetup"

export type RecorderControlsContext = {
  type: RecordingType
  withCountdown: boolean
  mediaRecorderRef: React.RefObject<MediaRecorder | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  canvasSetupDeferredRef: React.RefObject<boolean>
  recordedChunksRef: React.RefObject<Blob[]>
  isRecordingRef: React.RefObject<boolean>
  cancelRequestRef: React.RefObject<boolean | null>
  isStopped: boolean
  mediaRecorder: MediaRecorder | null
  recordBlob: Blob | null
  setupCtx: RecorderSetupContext
  resetChunks: () => void
  resetTimer: () => void
  setIsStopped: React.Dispatch<React.SetStateAction<boolean>>
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>
  setIsPriming: React.Dispatch<React.SetStateAction<boolean>>
  setIsStopping: React.Dispatch<React.SetStateAction<boolean>>
  setIsFinalizing: React.Dispatch<React.SetStateAction<boolean>>
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>
  setCountdownRemaining: React.Dispatch<React.SetStateAction<number | null>>
  stopNotificationProcess: () => void
  startCountdown: () => void
  clearMediaRecorder: () => void
  reinitializeStreams: () => void
  requiresStreamRepickOnRestart: boolean
  clearMediaStreamForRestart: () => void
  armRestartCountdownAfterStream: () => void
  confirm: (options: {
    title: string
    description: string
    confirmLabel: string
    cancelLabel: string
  }) => Promise<boolean>
  confirmDiscard: {
    title: string
    description: string
    confirmLabel: string
    cancelLabel: string
  }
  notifications: {
    timeLimitReached: string
    timeLimitTitle: string
    canvasPrimeTimeout: string
  }
}

export async function beginRecordingSession(
  ctx: RecorderControlsContext
): Promise<void> {
  const usesCanvas = Boolean(ctx.canvasRef.current)

  if (usesCanvas) {
    resetCanvasPrimedGate()
    ctx.setIsPriming(true)
    const primed = await waitForCanvasPrimed()
    if (!primed) {
      toast.warning(ctx.notifications.canvasPrimeTimeout)
    }
    if (ctx.canvasSetupDeferredRef.current || !ctx.mediaRecorderRef.current) {
      setupRecorder(ctx.setupCtx)
    }
  } else if (!ctx.mediaRecorderRef.current) {
    setupRecorder(ctx.setupCtx)
  }

  const recorder = ctx.mediaRecorderRef.current
  if (!recorder || recorder.state === "recording") {
    ctx.setIsPriming(false)
    return
  }

  ctx.resetTimer()
  ctx.setIsStopped(false)
  ctx.setIsPaused(false)
  ctx.recordedChunksRef.current = []
  ctx.resetChunks()
  ctx.setCountdownRemaining(null)

  const timesliceMs = ctx.type === RECORDING_TYPE.AUDIO ? undefined : 250
  if (timesliceMs) {
    recorder.start(timesliceMs)
  } else {
    recorder.start()
  }

  ctx.isRecordingRef.current = true
  ctx.setIsRecording(true)
  ctx.setIsPriming(false)
  ConsoleLogger.info("Recording started")
}

export function recorderStop(
  ctx: RecorderControlsContext,
  limitReached = false
): void {
  ConsoleLogger.info("On recorderStop function", { limitReached })
  ctx.setIsStopping(true)
  ctx.setIsFinalizing(true)
  ctx.setIsStopped(true)
  stopActiveRecorder(ctx.setupCtx, { finalize: true, cleanup: true })

  if (limitReached === true) {
    notifyMe(
      ctx.notifications.timeLimitReached,
      ctx.notifications.timeLimitTitle
    )
  }
}

export async function recorderStart(
  ctx: RecorderControlsContext,
  fromClick = false
): Promise<void> {
  ConsoleLogger.info("on recorderStart function")
  if (ctx.withCountdown && !fromClick) return

  const hasPriorRecording =
    ctx.recordedChunksRef.current.length > 0 || Boolean(ctx.recordBlob)

  if (ctx.isStopped && hasPriorRecording) {
    if (!fromClick) {
      const ok = await ctx.confirm(ctx.confirmDiscard)
      if (!ok) return
      ctx.clearMediaRecorder()
      ctx.reinitializeStreams()
      return
    }

    ctx.resetChunks()
    ctx.resetTimer()

    if (ctx.requiresStreamRepickOnRestart) {
      ctx.clearMediaStreamForRestart()
      ctx.reinitializeStreams()
      ctx.setIsStopped(false)
      ctx.armRestartCountdownAfterStream()
      return
    }

    ctx.setIsStopped(false)
  }

  if (ctx.cancelRequestRef.current) {
    ctx.cancelRequestRef.current = false
    if (!fromClick) return
  }

  ctx.stopNotificationProcess()

  if (ctx.withCountdown) {
    ctx.startCountdown()
  } else {
    await beginRecordingSession(ctx)
  }
}

export function recorderPause(ctx: RecorderControlsContext): void {
  ctx.setIsPaused(true)
  ctx.mediaRecorder?.pause()
}

export function recorderResume(ctx: RecorderControlsContext): void {
  ctx.setIsPaused(false)
  ctx.mediaRecorder?.resume()
}

export function downloadRecording(ctx: RecorderControlsContext): void {
  ConsoleLogger.info("Download recording", ctx.recordBlob)
  if (!ctx.recordBlob) return
  const MimeDictionary = getMimeDictionary()
  const file = getFileFromBlob(
    ctx.recordBlob,
    ctx.type,
    MimeDictionary[ctx.type]
  )
  const url = URL.createObjectURL(file)
  const a = document.createElement("a")
  a.href = url
  a.download = file.name
  a.click()
  URL.revokeObjectURL(url)
}
