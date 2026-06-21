import { useCallback, useEffect, useRef, useState } from "react";

import { requestNotificationPermission } from "../desktopNotification";
import useMediaRecorder from "../useMediaRecorder";
import useStream from "../useStream";

import ConsoleLogger from "@/helpers/consoleLogger";
import { cancelVideoFrame, CAPTURE_TARGET_FPS, requestVideoFrame, shouldDrawThisFrame } from "@/helpers/videoFrameHelper";
import type { DevicesList, RecorderSettings } from "@/types/recording";

type UseVideoRecorderArgs = {
  recorderSettings: RecorderSettings;
  selectedAudioDevice: string | null;
  selectedVideoDevice: string | null;
  devicesList: DevicesList;
  isMicDisabled: boolean;
};

export default function useVideoRecorder({
  recorderSettings,
  selectedAudioDevice,
  selectedVideoDevice,
  devicesList,
  isMicDisabled,
}: UseVideoRecorderArgs) {
  const { isPermissionDenied: streamPermissionDenied, initAudioStream, initCameraStream, clearStream, micStream, cameraStream, videoRef } = useStream();

  const reinitializeStreams = () => {
    setPlayerReady(false);
    clearStream();
    initAudioStream(selectedAudioDevice, recorderSettings.quality);
    initCamStream();
  };

  const mRec = useMediaRecorder({
    withCountdown: recorderSettings.countDown,
    clearStream,
    reinitializeStreams,
    isMicDisabled,
    canvasCaptureFrameRate: CAPTURE_TARGET_FPS,
    quality: recorderSettings.quality,
  });
  const {
    mediaStreamRef,
    setMediaStream,
    mediaStream,
    mediaRecorder,
    isRecording,
    isPaused,
    isStopped,
    isEncoderActive,
    isFinalizing,
    isStopping,
    countdownRemaining,
    countDownStatus,
    clearMediaRecorder,
    canvasRef,
    recorderStart,
    recorderPause,
    recorderResume,
    recorderStop,
    downloadRecording,
    formattedTimer,
    recordBlob,
    recordTimer,
    setIsStopped,
    setRecordTimer,
    setRecordBlob,
    onCancelRecordingInit,
    signalCanvasPrimed,
  } = mRec;

  const animationFrameRef = useRef<number | null>(null);
  const canvasDimensionsRef = useRef<{ width: number; height: number } | null>(null);

  const initCamStream = useCallback(() => {
    const selectedDevice = devicesList.videoDevices.find((device) => device.deviceId === selectedVideoDevice);

    initCameraStream(selectedVideoDevice, {
      isBackCamera: selectedDevice?.label.toLowerCase().includes("back") ?? false,
      quality: recorderSettings.quality,
    });
  }, [devicesList.videoDevices, initCameraStream, recorderSettings.quality, selectedVideoDevice]);

  const previousQualityRef = useRef(recorderSettings.quality);

  useEffect(() => {
    if (cameraStream && (isMicDisabled || micStream)) {
      const newStream = new MediaStream();
      [micStream, cameraStream].forEach((stream) => {
        if (!stream) return;
        stream.getTracks().forEach((track) => newStream.addTrack(track));
      });
      setMediaStream(newStream);
      mediaStreamRef.current = newStream;
      ConsoleLogger.info("Media stream initialized", { newStream });
    }
  }, [micStream, cameraStream]);

  // Re-apply camera constraints when quality changes (720p / 1080p) — skip initial mount.
  useEffect(() => {
    if (previousQualityRef.current === recorderSettings.quality) return;
    previousQualityRef.current = recorderSettings.quality;
    if (!selectedVideoDevice || isRecording || isStopped) return;
    clearStream();
    initCamStream();
  }, [recorderSettings.quality, selectedVideoDevice, isRecording, isStopped, clearStream, initCamStream]);

  useEffect(() => {
    requestNotificationPermission();
    return () => {
      clearStream();
      clearMediaRecorder();
      if (animationFrameRef.current !== null) {
        cancelVideoFrame(videoRef.current, animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setPlayerReady(false);
  }, [recordBlob]);

  useEffect(() => {
    if (!isEncoderActive || !cameraStream) {
      return undefined;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !video) return undefined;

    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return undefined;

    let cancelled = false;
    let lastDrawMs = 0;
    let hasPrimed = false;

    const draw = () => {
      if (cancelled) return;

      if (isPaused && !isStopping) {
        animationFrameRef.current = requestVideoFrame(video, draw);
        return;
      }

      if (!shouldDrawThisFrame(lastDrawMs, CAPTURE_TARGET_FPS)) {
        animationFrameRef.current = requestVideoFrame(video, draw);
        return;
      }
      lastDrawMs = performance.now();

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        if (!isRecording) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvasDimensionsRef.current = { width: video.videoWidth, height: video.videoHeight };
          }
        } else if (canvasDimensionsRef.current) {
          const { width, height } = canvasDimensionsRef.current;
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }
        } else if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvasDimensionsRef.current = { width: video.videoWidth, height: video.videoHeight };
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        if (recorderSettings.mirror) {
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        ctx.restore();

        if (!hasPrimed) {
          hasPrimed = true;
          signalCanvasPrimed();
        }
      }

      animationFrameRef.current = requestVideoFrame(video, draw);
    };

    draw();

    return () => {
      cancelled = true;
      if (animationFrameRef.current !== null) {
        cancelVideoFrame(video, animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [cameraStream, isEncoderActive, isPaused, isRecording, isStopping, recorderSettings.mirror, signalCanvasPrimed]);

  const [playerReady, setPlayerReady] = useState(false);

  return {
    videoRef,
    canvasRef,

    recordBlob,
    recordTimer,

    formattedTimer,
    countdownRemaining,
    countDownStatus,
    isFinalizing,

    playerReady,
    setPlayerReady,

    mediaRecorder,
    isRecording,
    isPaused,
    isStopped,

    setIsStopped,
    setRecordTimer,
    setRecordBlob,

    streamPermissionDenied,

    mediaStream,
    initAudioStream,
    initCamStream,
    clearStream,
    clearMediaRecorder,

    recorderStart,
    recorderPause,
    recorderResume,
    recorderStop,
    downloadRecording,

    onCancelRecordingInit,
    reinitializeStreams,
  };
}
