import { useCallback, useRef, useState } from "react";

import ConsoleLogger from "@/helpers/consoleLogger";
import { displayMediaOptions, getAudioConstraints, getVideoConstraints } from "@/helpers/mediaConstraints";
import { getScreenCapturePromise, setScreenCapturePromise } from "@/helpers/screenCaptureDedup";
import type { Quality } from "@/types/recording";

type InitCameraOptions = {
  aspectRatio?: number;
  isBackCamera?: boolean;
  quality?: Quality | null;
  mediaConstraints?: MediaStreamConstraints;
};

type InitScreenStreamOptions = {
  force?: boolean;
  quality?: Quality | null;
};

function applyContentHint(track: MediaStreamTrack, hint: string): void {
  if ("contentHint" in track) {
    (track as MediaStreamTrack & { contentHint: string }).contentHint = hint;
  }
}

export default function useStream() {
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const screenRef = useRef<HTMLVideoElement | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const initAudioStream = useCallback((deviceId: string | null = null, quality: Quality | null = null) => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    const audioConstraints = getAudioConstraints(deviceId, quality);
    audioConstraints.video = false;

    ConsoleLogger.info("Starting audio stream with constraints: ", audioConstraints);

    navigator.mediaDevices
      .getUserMedia(audioConstraints)
      .then((stream) => {
        micStreamRef.current = stream;
        setMicStream(stream);
        if (audioRef.current) {
          audioRef.current.srcObject = stream;
        }
        ConsoleLogger.info("Audio stream started");
      })
      .catch((error: DOMException) => {
        ConsoleLogger.error("Error starting audio stream: ", error);
        if (error.name === "NotAllowedError") {
          setIsPermissionDenied(true);
        }
      });
  }, []);

  const initCameraStream = useCallback((
    deviceId: string | null,
    {
      aspectRatio = 16 / 9,
      isBackCamera = false,
      quality = null,
      mediaConstraints = getVideoConstraints({ deviceId, aspectRatio, isBackCamera, quality }),
    }: InitCameraOptions = {},
  ) => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      setCameraStream(null);
    }

    ConsoleLogger.info("Starting camera stream with constraints: ", mediaConstraints);
    navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then((stream) => {
        stream.getVideoTracks().forEach((track) => applyContentHint(track, "detail"));
        cameraStreamRef.current = stream;
        setCameraStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          void videoRef.current.play().catch(() => {});
        }

        ConsoleLogger.info("Camera stream started");
      })
      .catch((error: DOMException) => {
        ConsoleLogger.error("Error starting camera stream: ", error);
        if (error.name === "NotAllowedError") {
          setIsPermissionDenied(true);
        }
      });
  }, []);

  const initScreenStream = (audioDeviceId: string | null = null, options: InitScreenStreamOptions = {}) => {
    const { force = false, quality = null } = options;

    const attachScreenStream = (stream: MediaStream) => {
      stream.getVideoTracks().forEach((track) => applyContentHint(track, "motion"));
      screenStreamRef.current = stream;
      setScreenStream(stream);
      if (screenRef.current) {
        screenRef.current.srcObject = stream;
        screenRef.current.muted = true;
        screenRef.current.playsInline = true;
        void screenRef.current.play().catch(() => {});
      }
      ConsoleLogger.info("Screen stream started");
    };

    const handleScreenError = (error: DOMException) => {
      ConsoleLogger.error("Error starting screen stream: ", error);
      if (error.name === "NotAllowedError") {
        setIsPermissionDenied(true);
      }
    };

    if (!force && screenStreamRef.current?.active) {
      return;
    }

    const existingPromise = getScreenCapturePromise();
    if (!force && existingPromise) {
      void existingPromise.then(attachScreenStream).catch(handleScreenError);
      return;
    }

    if (force && screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
    }

    const displayMediaConstraints = displayMediaOptions(audioDeviceId, quality);
    ConsoleLogger.info("Display media constraints: ", displayMediaConstraints);

    const capturePromise = navigator.mediaDevices
      .getDisplayMedia(displayMediaConstraints)
      .then((stream) => {
        attachScreenStream(stream);
        return stream;
      })
      .catch((error: DOMException) => {
        handleScreenError(error);
        throw error;
      })
      .finally(() => {
        setScreenCapturePromise(null);
      });

    setScreenCapturePromise(capturePromise);
  };

  const clearStream = useCallback(() => {
    ConsoleLogger.info("Clearing streams", {
      micStreamRef: micStreamRef.current,
      cameraStreamRef: cameraStreamRef.current,
      screenStreamRef: screenStreamRef.current,
    });
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setMicStream(null);
    setCameraStream(null);
    setScreenStream(null);
  }, []);

  return {
    initAudioStream,
    initCameraStream,
    initScreenStream,
    clearStream,
    videoRef,
    audioRef,
    screenRef,
    micStream,
    cameraStream,
    screenStream,
    isPermissionDenied,
  };
}
