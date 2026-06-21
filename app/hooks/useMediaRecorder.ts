import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import { useTranslations } from "next-intl"

import {
  buildControlsContext,
  buildSetupContext,
} from "./recorder/recorderContextBuilders"
import type { RecorderControlsContext } from "./recorder/useRecorderControls"
import type { RecorderSetupContext } from "./recorder/useRecorderSetup"
import useRecorderChunks from "./recorder/useRecorderChunks"
import {
  beginRecordingSession as beginRecordingSessionAction,
  downloadRecording as downloadRecordingAction,
  recorderPause as recorderPauseAction,
  recorderResume as recorderResumeAction,
  recorderStart as recorderStartAction,
  recorderStop as recorderStopAction,
} from "./recorder/useRecorderControls"
import useRecordingCountdown from "./recorder/useRecordingCountdown"
import useRecordingNotifications from "./recorder/useRecordingNotifications"
import useRecordingTimer from "./recorder/useRecordingTimer"
import { setupRecorder as setupRecorderAction } from "./recorder/useRecorderSetup"
import useRecorderStream from "./recorder/useRecorderStream"

import { RECORDING_TYPE, type RecordingType } from "@/constants/recordingTypes"
import type { Quality } from "@/types/recording"
import {
  clearCanvasPrimedGate,
  notifyCanvasPrimed,
} from "@/helpers/canvasPrimeGate"
import { getMimeDictionary } from "@/helpers/mimeTypeHelper"
import { useConfirm } from "@/contexts/confirmDialogContext"

type UseMediaRecorderArgs = {
  type?: RecordingType
  withCountdown?: boolean
  clearStream?: () => void
  reinitializeStreams?: () => void
  isMicDisabled?: boolean
  canvasCaptureFrameRate?: number
  quality?: Quality | null
}

const noop = () => {}

export default function useMediaRecorder({
  type = RECORDING_TYPE.VIDEO,
  withCountdown = false,
  clearStream = noop,
  reinitializeStreams = noop,
  isMicDisabled = false,
  canvasCaptureFrameRate = 30,
  quality = null,
}: UseMediaRecorderArgs) {
  const confirm = useConfirm()
  const tConfirm = useTranslations("confirm")
  const tNotifications = useTranslations("notifications")
  const MimeDictionary = getMimeDictionary()

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isRecordingRef = useRef(false)
  const canvasSetupDeferredRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const pendingStopCleanupRef = useRef(false)
  const clearMediaRecorderRef = useRef<() => void>(() => {})
  const recorderStopRef = useRef<(limitReached?: boolean) => void>(() => {})
  const beginRecordingSessionRef = useRef<() => Promise<void>>(async () => {})
  const setupCtxRef = useRef<RecorderSetupContext | null>(null)
  const controlsCtxRef = useRef<RecorderControlsContext | null>(null)
  const pendingRestartCountdownRef = useRef(false)
  const requiresStreamRepickOnRestart =
    type === RECORDING_TYPE.SCREEN || type === RECORDING_TYPE.SCREEN_VIDEO

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isStopped, setIsStopped] = useState(false)
  const [isPriming, setIsPriming] = useState(false)
  const [isStopping, setIsStopping] = useState(false)

  const chunks = useRecorderChunks({ type, mimeInfo: MimeDictionary[type] })
  const {
    recordBlob,
    setRecordBlob,
    isFinalizing,
    setIsFinalizing,
    recordedChunksRef,
    activeRecorderGenerationRef,
    bumpGeneration,
    appendChunk,
    finalizeRecordBlob,
    resetChunks,
    detachRecorderHandlers,
  } = chunks

  const { clearMediaStream } = useRecorderStream({
    mediaStreamRef,
    setMediaStream,
  })

  const runDeferredStreamCleanup = useCallback(() => {
    if (!pendingStopCleanupRef.current) return
    pendingStopCleanupRef.current = false
    clearStream()
    clearMediaStream()
  }, [clearStream, clearMediaStream])

  const { recordTimer, setRecordTimer, formattedTimer, resetTimer } =
    useRecordingTimer({
      isRecording,
      isPaused,
      onLimitReached: () => recorderStopRef.current(true),
    })

  const notifications = useRecordingNotifications({ type, isRecordingRef })
  const {
    startNotificationProcess,
    stopNotificationProcess,
    niProcessTimeoutIdRef,
  } = notifications

  const countdown = useRecordingCountdown({
    onCountdownComplete: () => void beginRecordingSessionRef.current(),
    onCountdownCancelled: () => startNotificationProcess(),
  })
  const {
    countdownRemaining,
    setCountdownRemaining,
    countDownStatus,
    cancelRequestRef,
    startCountdown,
    onCancelRecordingInit,
    resetCountdown,
  } = countdown

  const armRestartCountdownAfterStream = useCallback(() => {
    pendingRestartCountdownRef.current = true
  }, [])

  const clearMediaStreamForRestart = useCallback(() => {
    clearMediaStream()
  }, [clearMediaStream])

  const clearMediaRecorder = useCallback(() => {
    pendingStopCleanupRef.current = false
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== "inactive") {
      detachRecorderHandlers(recorder)
      recorder.stop()
    }
    mediaRecorderRef.current = null
    setMediaRecorder(null)
    clearMediaStream()
    clearCanvasPrimedGate()
    resetChunks()
    setIsRecording(false)
    isRecordingRef.current = false
    setIsPaused(false)
    setIsStopped(false)
    setIsPriming(false)
    setIsStopping(false)
    resetCountdown()
    resetTimer()
    setMediaStream(null)
    canvasSetupDeferredRef.current = false
    stopNotificationProcess()
  }, [
    clearMediaStream,
    detachRecorderHandlers,
    resetChunks,
    resetCountdown,
    resetTimer,
    stopNotificationProcess,
    setMediaRecorder,
    setIsRecording,
    setIsPaused,
    setIsStopped,
    setIsPriming,
    setIsStopping,
    setMediaStream,
  ])

  useLayoutEffect(() => {
    const setupCtx = buildSetupContext({
      type,
      mediaStreamRef,
      mediaRecorderRef,
      canvasRef,
      canvasSetupDeferredRef,
      isMicDisabled,
      canvasCaptureFrameRate,
      quality,
      recordedChunksRef,
      activeRecorderGenerationRef,
      isRecordingRef,
      pendingStopCleanupRef,
      bumpGeneration,
      appendChunk,
      finalizeRecordBlob,
      detachRecorderHandlers,
      setMediaRecorder,
      setIsRecording,
      setIsStopping,
      setIsPriming,
      runDeferredStreamCleanup,
      recorderUnsupportedMessage: tNotifications("recorderUnsupported"),
    })

    setupCtxRef.current = setupCtx
    controlsCtxRef.current = buildControlsContext({
      type,
      withCountdown,
      mediaRecorderRef,
      canvasRef,
      canvasSetupDeferredRef,
      recordedChunksRef,
      isRecordingRef,
      cancelRequestRef,
      isStopped,
      mediaRecorder,
      recordBlob,
      setupCtx,
      resetChunks,
      resetTimer,
      setIsStopped,
      setIsPaused,
      setIsPriming,
      setIsStopping,
      setIsFinalizing,
      setIsRecording,
      setCountdownRemaining,
      stopNotificationProcess,
      startCountdown,
      clearMediaRecorder: () => clearMediaRecorderRef.current(),
      reinitializeStreams,
      requiresStreamRepickOnRestart,
      clearMediaStreamForRestart,
      armRestartCountdownAfterStream,
      confirm,
      confirmDiscard: {
        title: tConfirm("discardRecordingTitle"),
        description: tConfirm("discardRecordingDescription"),
        confirmLabel: tConfirm("discardAndRestart"),
        cancelLabel: tConfirm("keepRecording"),
      },
      notifications: {
        timeLimitReached: tNotifications("timeLimitReached"),
        timeLimitTitle: tNotifications("recordingTitle"),
        canvasPrimeTimeout: tNotifications("canvasPrimeTimeout"),
      },
    })
  }, [
    type,
    isMicDisabled,
    canvasCaptureFrameRate,
    quality,
    bumpGeneration,
    appendChunk,
    finalizeRecordBlob,
    detachRecorderHandlers,
    runDeferredStreamCleanup,
    tNotifications,
    withCountdown,
    cancelRequestRef,
    isStopped,
    mediaRecorder,
    recordBlob,
    resetChunks,
    resetTimer,
    setIsStopped,
    setIsPaused,
    setIsPriming,
    setIsStopping,
    setIsFinalizing,
    setIsRecording,
    setCountdownRemaining,
    stopNotificationProcess,
    startCountdown,
    reinitializeStreams,
    requiresStreamRepickOnRestart,
    clearMediaStreamForRestart,
    armRestartCountdownAfterStream,
    confirm,
    tConfirm,
    setMediaRecorder,
    activeRecorderGenerationRef,
    recordedChunksRef,
  ])

  const setupRecorder = useCallback(() => {
    if (setupCtxRef.current) setupRecorderAction(setupCtxRef.current)
  }, [])

  const beginRecordingSession = useCallback(async () => {
    if (controlsCtxRef.current)
      await beginRecordingSessionAction(controlsCtxRef.current)
  }, [])
  const recorderStop = useCallback((limitReached = false) => {
    if (controlsCtxRef.current)
      recorderStopAction(controlsCtxRef.current, limitReached)
  }, [])
  const recorderStart = useCallback(async (fromClick = false) => {
    if (controlsCtxRef.current)
      await recorderStartAction(controlsCtxRef.current, fromClick)
  }, [])
  const recorderPause = useCallback(() => {
    if (controlsCtxRef.current) recorderPauseAction(controlsCtxRef.current)
  }, [])
  const recorderResume = useCallback(() => {
    if (controlsCtxRef.current) recorderResumeAction(controlsCtxRef.current)
  }, [])
  const downloadRecording = useCallback(() => {
    if (controlsCtxRef.current) downloadRecordingAction(controlsCtxRef.current)
  }, [])

  useLayoutEffect(() => {
    clearMediaRecorderRef.current = clearMediaRecorder
    beginRecordingSessionRef.current = beginRecordingSession
    recorderStopRef.current = recorderStop
  }, [clearMediaRecorder, beginRecordingSession, recorderStop])

  const signalCanvasPrimed = useCallback(() => notifyCanvasPrimed(), [])

  useEffect(() => {
    mediaStreamRef.current = mediaStream
  }, [mediaStream])

  useEffect(() => {
    if (!mediaStream) return
    if (canvasRef.current) {
      canvasSetupDeferredRef.current = true
      return
    }
    queueMicrotask(() => setupRecorder())
  }, [mediaStream, setupRecorder])

  useEffect(() => {
    if (!pendingRestartCountdownRef.current || !mediaStream || isStopped) return

    pendingRestartCountdownRef.current = false
    stopNotificationProcess()
    if (withCountdown) {
      startCountdown()
    } else {
      void beginRecordingSessionRef.current()
    }
  }, [
    mediaStream,
    isStopped,
    withCountdown,
    startCountdown,
    stopNotificationProcess,
  ])

  useEffect(() => {
    if (!mediaStream || isStopped) return
    if (pendingRestartCountdownRef.current) return
    queueMicrotask(() => {
      if (withCountdown) {
        if (!niProcessTimeoutIdRef.current) startNotificationProcess()
      } else {
        void beginRecordingSessionRef.current()
      }
    })
  }, [
    mediaStream,
    isStopped,
    withCountdown,
    startNotificationProcess,
    niProcessTimeoutIdRef,
  ])

  return {
    mediaRecorder,
    setMediaRecorder,
    mediaStream,
    mediaStreamRef,
    setMediaStream,
    isRecording,
    setIsRecording,
    isPaused,
    setIsPaused,
    isStopped,
    setIsStopped,
    isPriming,
    isStopping,
    isFinalizing,
    isEncoderActive: isPriming || isRecording || isStopping,
    recordTimer,
    setRecordTimer,
    formattedTimer,
    countdownRemaining,
    countDownStatus,
    setCountDownStatus: setCountdownRemaining,
    canvasRef,
    recordBlob,
    setRecordBlob,
    cancelRequestRef,
    setupRecorder,
    clearMediaRecorder,
    downloadRecording,
    recorderStart,
    recorderStop,
    recorderPause,
    recorderResume,
    onCancelRecordingInit,
    signalCanvasPrimed,
  }
}
