import { useEffect, useRef, useState } from "react";

import { requestNotificationPermission } from "../desktopNotification";
import useMediaRecorder from "../useMediaRecorder";
import useStream from "../useStream";

import { RECORDING_TYPE } from "@/constants/recordingTypes";
import { getOverlayCameraConstraints } from "@/helpers/mediaConstraints";
import ConsoleLogger from "@/helpers/consoleLogger";
import { computeCompositorLayout, drawScreenOnlyFrame, drawScreenWebcamFrame } from "@/helpers/screenWebcamCompositor";
import { CAPTURE_TARGET_FPS, shouldDrawThisFrame } from "@/helpers/videoFrameHelper";
import useScreenTrackMonitor from "@/hooks/recorder/useScreenTrackMonitor";
import { DEFAULT_WEBCAM_OVERLAY } from "@/constants/recording";
import type { RecorderSettings, WebcamOverlayPlacement } from "@/types/recording";

type UseScreenWithCamRecorderArgs = {
  selectedAudioDevice: string | null;
  selectedVideoDevice: string | null;
  recorderSettings: RecorderSettings;
  muteAudio: boolean;
  isMicDisabled: boolean;
};

const CANVAS_CAPTURE_FPS = CAPTURE_TARGET_FPS;

export default function useScreenWithCamRecorder({
  selectedAudioDevice,
  selectedVideoDevice,
  recorderSettings,
  muteAudio,
  isMicDisabled,
}: UseScreenWithCamRecorderArgs) {
  const [playerReady, setPlayerReady] = useState(false);
  const [webcamOverlay, setWebcamOverlay] = useState<WebcamOverlayPlacement>(DEFAULT_WEBCAM_OVERLAY);

  const { isPermissionDenied: streamPermissionDenied, initAudioStream, initCameraStream, initScreenStream, clearStream, micStream, cameraStream, screenStream, screenRef, videoRef } =
    useStream();

  const getCameraStreamConstraints = (): { aspectRatio: number; mediaConstraints: MediaStreamConstraints } => ({
    aspectRatio: 1,
    mediaConstraints: getOverlayCameraConstraints(selectedVideoDevice, recorderSettings.quality),
  });

  const reinitializeStreams = () => {
    setPlayerReady(false);
    clearStream();
    if (!muteAudio && !isMicDisabled) {
      initAudioStream(selectedAudioDevice, recorderSettings.quality);
    }
    initScreenStream(selectedAudioDevice, { force: true, quality: recorderSettings.quality });
    initCameraStream(selectedVideoDevice, getCameraStreamConstraints());
  };

  const useMediaRec = useMediaRecorder({
    type: RECORDING_TYPE.SCREEN_VIDEO,
    withCountdown: recorderSettings.countDown,
    clearStream,
    reinitializeStreams,
    isMicDisabled: isMicDisabled || muteAudio,
    canvasCaptureFrameRate: CANVAS_CAPTURE_FPS,
    quality: recorderSettings.quality,
  });

  const {
    mediaStreamRef,
    canvasRef,
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
  } = useMediaRec;

  const layoutRef = useRef<ReturnType<typeof computeCompositorLayout> | null>(null);
  const canvasDimensionsRef = useRef<{ width: number; height: number } | null>(null);
  const overlayLayoutKeyRef = useRef("");
  const compositorWebcamRef = useRef<HTMLVideoElement | null>(null);

  const getOverlayLayoutKey = () =>
    `${webcamOverlay.centerX}:${webcamOverlay.centerY}:${webcamOverlay.size}`;

  useEffect(() => {
    const video = compositorWebcamRef.current;
    if (!video || !cameraStream) {
      return;
    }
    if (video.srcObject !== cameraStream) {
      video.srcObject = cameraStream;
    }
    video.muted = true;
    video.playsInline = true;
    void video.play().catch(() => {});
  }, [cameraStream]);

  useEffect(() => {
    if (selectedVideoDevice) {
      initCameraStream(selectedVideoDevice, getCameraStreamConstraints());
    }
  }, [selectedVideoDevice]);

  useEffect(() => {
    if (selectedAudioDevice && !muteAudio && !isMicDisabled) {
      initAudioStream(selectedAudioDevice);
    }
  }, [selectedAudioDevice, muteAudio, isMicDisabled]);

  useEffect(() => {
    requestNotificationPermission();
    return () => {
      clearStream();
      clearMediaRecorder();
    };
  }, []);

  useEffect(() => {
    if (!screenStream) {
      setMediaStream(null);
      mediaStreamRef.current = null;
      return;
    }

    const newStream = new MediaStream();
    if (micStream) {
      micStream.getTracks().forEach((track) => newStream.addTrack(track));
    }
    screenStream.getAudioTracks().forEach((track) => newStream.addTrack(track));
    ConsoleLogger.info("Screen stream ready for recorder setup.", { hasMic: Boolean(micStream) });
    setMediaStream(newStream);
    mediaStreamRef.current = newStream;
  }, [micStream, screenStream]);

  useEffect(() => {
    if (screenStream) {
      const screenTrack = screenStream.getVideoTracks()[0];
      const { width = 0, height = 0 } = screenTrack.getSettings();
      if (width > 0 && height > 0) {
        canvasDimensionsRef.current = { width, height };
      }
    }
  }, [screenStream]);

  useEffect(() => {
    setPlayerReady(false);
  }, [recordBlob]);

  const showCompositePreview = isRecording;

  useScreenTrackMonitor({
    screenStream,
    isRecording,
    onScreenShareEnded: recorderStop,
  });

  useEffect(() => {
    if (!isEncoderActive || !screenStream) {
      return undefined;
    }

    const canvas = canvasRef.current;
    const screenVideo = screenRef.current;
    if (!canvas || !screenVideo) {
      return undefined;
    }

    const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!context) {
      return undefined;
    }

    let frameId: number | null = null;
    let cancelled = false;
    let lastDrawMs = 0;
    let hasPrimed = false;

    const syncCanvasDimensions = () => {
      if (isRecording && canvasDimensionsRef.current) {
        const { width, height } = canvasDimensionsRef.current;
        if (canvas.width !== width || canvas.height !== height) {
          return;
        }
      }

      const cached = canvasDimensionsRef.current;
      if (cached && cached.width > 0 && cached.height > 0) {
        if (canvas.width !== cached.width || canvas.height !== cached.height) {
          canvas.width = cached.width;
          canvas.height = cached.height;
          layoutRef.current = null;
        }
        return;
      }

      const screenTrack = screenStream.getVideoTracks()[0];
      const { width = 0, height = 0 } = screenTrack.getSettings();
      if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
        canvas.width = width;
        canvas.height = height;
        canvasDimensionsRef.current = { width, height };
        layoutRef.current = null;
      }
    };

    const drawToCanvas = () => {
      if (cancelled) {
        return;
      }

      if (isPaused && !isStopping) {
        frameId = requestAnimationFrame(drawToCanvas);
        return;
      }

      // Clock the composite off rAF, not the screen video's frame callback:
      // getDisplayMedia drops to a few fps when the screen is static, which
      // would undersample the webcam region and make the recorded camera
      // choppy. rAF gives a steady cadence; shouldDrawThisFrame caps it to 30.
      const now = performance.now();
      if (!shouldDrawThisFrame(lastDrawMs, CANVAS_CAPTURE_FPS)) {
        frameId = requestAnimationFrame(drawToCanvas);
        return;
      }
      lastDrawMs = now;

      syncCanvasDimensions();

      if (canvas.width === 0 || canvas.height === 0 || screenVideo.videoWidth === 0) {
        frameId = requestAnimationFrame(drawToCanvas);
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      const webcamVideo = compositorWebcamRef.current;
      const webcamReady = Boolean(webcamVideo && webcamVideo.videoWidth > 0 && webcamVideo.videoHeight > 0);

      if (webcamReady && webcamVideo) {
        const layoutKey = getOverlayLayoutKey();
        if (
          !layoutRef.current ||
          layoutRef.current.canvasWidth !== canvas.width ||
          layoutRef.current.canvasHeight !== canvas.height ||
          overlayLayoutKeyRef.current !== layoutKey
        ) {
          layoutRef.current = computeCompositorLayout(canvas.width, canvas.height, webcamOverlay);
          overlayLayoutKeyRef.current = layoutKey;
        }

        drawScreenWebcamFrame({
          context,
          screenVideo,
          webcamVideo,
          layout: layoutRef.current,
          mirrorWebcam: recorderSettings.mirror,
        });
      } else {
        drawScreenOnlyFrame(context, screenVideo, canvas.width, canvas.height);
      }

      if (!hasPrimed) {
        hasPrimed = true;
        signalCanvasPrimed();
      }

      frameId = requestAnimationFrame(drawToCanvas);
    };

    drawToCanvas();

    return () => {
      cancelled = true;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [
    cameraStream,
    isEncoderActive,
    isPaused,
    isRecording,
    isStopping,
    recorderSettings.mirror,
    screenStream,
    signalCanvasPrimed,
    webcamOverlay,
  ]);

  return {
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
    clearStream,
    clearMediaRecorder,
    reinitializeStreams,
  };
}
