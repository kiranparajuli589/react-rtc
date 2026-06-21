import { buildRecordStream } from "./buildRecordStream";

import { getQualityPreset } from "@/constants/recording";
import { RECORDING_TYPE, type RecordingType } from "@/constants/recordingTypes";
import ConsoleLogger from "@/helpers/consoleLogger";
import { getMimeDictionary } from "@/helpers/mimeTypeHelper";
import type { Quality } from "@/types/recording";
import { toast } from "sonner";

export type RecorderSetupContext = {
  type: RecordingType;
  mediaStreamRef: React.RefObject<MediaStream | null>;
  mediaRecorderRef: React.RefObject<MediaRecorder | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasSetupDeferredRef: React.RefObject<boolean>;
  isMicDisabled: boolean;
  canvasCaptureFrameRate: number;
  quality?: Quality | null;
  recordedChunksRef: React.RefObject<Blob[]>;
  activeRecorderGenerationRef: React.RefObject<number>;
  isRecordingRef: React.RefObject<boolean>;
  pendingStopCleanupRef: React.RefObject<boolean>;
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

export function stopActiveRecorder(
  ctx: RecorderSetupContext,
  options: { finalize: boolean; cleanup: boolean },
): void {
  const recorder = ctx.mediaRecorderRef.current;
  if (!recorder || recorder.state === "inactive") return;

  ctx.pendingStopCleanupRef.current = options.cleanup;
  if (!options.finalize) {
    ctx.bumpGeneration();
    ctx.detachRecorderHandlers(recorder);
  } else if (recorder.state === "recording" || recorder.state === "paused") {
    try {
      recorder.requestData();
    } catch (e) {
      ConsoleLogger.error("requestData failed before stop: ", e);
    }
  }

  recorder.stop();
}

export function setupRecorder(ctx: RecorderSetupContext): void {
  ConsoleLogger.info("Setting up recorder");
  const stream = ctx.mediaStreamRef.current;
  if (!stream) return;

  stopActiveRecorder(ctx, { finalize: false, cleanup: false });
  ctx.mediaRecorderRef.current = null;

  const recordStream = buildRecordStream({
    stream,
    canvas: ctx.canvasRef.current,
    isMicDisabled: ctx.isMicDisabled,
    canvasCaptureFrameRate: ctx.canvasCaptureFrameRate,
  });

  const MimeDictionary = getMimeDictionary();
  const selectedMimeType = MimeDictionary[ctx.type].mimeType;
  const preset = getQualityPreset(ctx.quality);
  const isScreenCapture = ctx.type === RECORDING_TYPE.SCREEN || ctx.type === RECORDING_TYPE.SCREEN_VIDEO;
  const options: MediaRecorderOptions = {
    mimeType: selectedMimeType ?? undefined,
    videoBitsPerSecond: isScreenCapture ? preset.screenVideoBitsPerSecond : preset.cameraVideoBitsPerSecond,
    audioBitsPerSecond: preset.audio.bitsPerSecond,
  };

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(recordStream, options);
  } catch (e) {
    ConsoleLogger.error("Error creating MediaRecorder: ", e);
    toast.error(ctx.recorderUnsupportedMessage);
    recorder = new MediaRecorder(recordStream);
  }

  ctx.recordedChunksRef.current = [];
  const generation = ctx.bumpGeneration();

  recorder.ondataavailable = (e: BlobEvent) => {
    ctx.appendChunk(generation, e.data);
  };

  recorder.onstop = () => {
    if (generation !== ctx.activeRecorderGenerationRef.current) return;

    ctx.isRecordingRef.current = false;
    ctx.setIsRecording(false);
    ctx.setIsStopping(false);
    ctx.setIsPriming(false);

    void ctx.finalizeRecordBlob(ctx.recordedChunksRef.current).then(() => {
      queueMicrotask(ctx.runDeferredStreamCleanup);
    });

    ctx.mediaRecorderRef.current = null;
    ctx.setMediaRecorder(null);
    ctx.canvasSetupDeferredRef.current = false;
  };

  ctx.mediaRecorderRef.current = recorder;
  ctx.setMediaRecorder(recorder);
  ctx.canvasSetupDeferredRef.current = false;
}
