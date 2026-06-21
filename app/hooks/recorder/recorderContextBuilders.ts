import type { RefObject } from "react";

import type { RecorderControlsContext } from "./useRecorderControls";
import type { RecorderSetupContext } from "./useRecorderSetup";

import type { RecordingType } from "@/constants/recordingTypes";
import type { Quality } from "@/types/recording";

type BuildSetupContextArgs = {
  type: RecordingType;
  mediaStreamRef: RefObject<MediaStream | null>;
  mediaRecorderRef: RefObject<MediaRecorder | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  canvasSetupDeferredRef: RefObject<boolean>;
  isMicDisabled: boolean;
  canvasCaptureFrameRate: number;
  quality?: Quality | null;
  recordedChunksRef: RefObject<Blob[]>;
  activeRecorderGenerationRef: RefObject<number>;
  isRecordingRef: RefObject<boolean>;
  pendingStopCleanupRef: RefObject<boolean>;
  bumpGeneration: () => number;
  appendChunk: (generation: number, data: Blob) => void;
  finalizeRecordBlob: (chunks: Blob[]) => Promise<void>;
  detachRecorderHandlers: (recorder: MediaRecorder | null | undefined) => void;
  setMediaRecorder: React.Dispatch<React.SetStateAction<MediaRecorder | null>>;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  setIsStopping: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPriming: React.Dispatch<React.SetStateAction<boolean>>;
  runDeferredStreamCleanup: () => void;
  recorderUnsupportedMessage: string;
};

export function buildSetupContext(args: BuildSetupContextArgs): RecorderSetupContext {
  return { ...args };
}

type BuildControlsContextArgs = {
  type: RecordingType;
  withCountdown: boolean;
  mediaRecorderRef: RefObject<MediaRecorder | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  canvasSetupDeferredRef: RefObject<boolean>;
  recordedChunksRef: RefObject<Blob[]>;
  isRecordingRef: RefObject<boolean>;
  cancelRequestRef: RefObject<boolean | null>;
  isStopped: boolean;
  mediaRecorder: MediaRecorder | null;
  recordBlob: Blob | null;
  setupCtx: RecorderSetupContext;
  resetChunks: () => void;
  resetTimer: () => void;
  setIsStopped: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPriming: React.Dispatch<React.SetStateAction<boolean>>;
  setIsStopping: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFinalizing: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  setCountdownRemaining: React.Dispatch<React.SetStateAction<number | null>>;
  stopNotificationProcess: () => void;
  startCountdown: () => void;
  clearMediaRecorder: () => void;
  reinitializeStreams: () => void;
  requiresStreamRepickOnRestart: boolean;
  clearMediaStreamForRestart: () => void;
  armRestartCountdownAfterStream: () => void;
  confirm: RecorderControlsContext["confirm"];
  confirmDiscard: RecorderControlsContext["confirmDiscard"];
  notifications: RecorderControlsContext["notifications"];
};

export function buildControlsContext(args: BuildControlsContextArgs): RecorderControlsContext {
  return { ...args };
}
