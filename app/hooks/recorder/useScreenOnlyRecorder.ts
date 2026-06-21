import { useEffect, useState } from "react";

import { requestNotificationPermission } from "../desktopNotification";
import useMediaRecorder from "../useMediaRecorder";
import useStream from "../useStream";

import { RECORDING_TYPE } from "@/constants/recordingTypes";
import ConsoleLogger from "@/helpers/consoleLogger";
import useScreenTrackMonitor from "@/hooks/recorder/useScreenTrackMonitor";
import type { RecorderSettings } from "@/types/recording";

type UseScreenOnlyRecorderArgs = {
  selectedAudioDevice: string | null;
  muteAudio: boolean;
  isMicDisabled: boolean;
  recorderSettings: RecorderSettings;
  enabled?: boolean;
};

export default function useScreenOnlyRecorder({
  selectedAudioDevice,
  muteAudio,
  isMicDisabled,
  recorderSettings,
  enabled = true,
}: UseScreenOnlyRecorderArgs) {
  const { isPermissionDenied: streamPermissionDenied, initAudioStream, initScreenStream, clearStream, micStream, screenStream, screenRef } = useStream();

  const reinitializeStreams = () => {
    ConsoleLogger.info("Reinitializing streams");
    setPlayerReady(false);
    clearStream();
    if (!muteAudio && !isMicDisabled) {
      initAudioStream(selectedAudioDevice, recorderSettings.quality);
    }
    initScreenStream(selectedAudioDevice, { force: true, quality: recorderSettings.quality });
  };

  const useMediaRec = useMediaRecorder({
    type: RECORDING_TYPE.SCREEN,
    withCountdown: recorderSettings.countDown,
    clearStream,
    reinitializeStreams,
    isMicDisabled: isMicDisabled || muteAudio,
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
    isFinalizing,
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
  } = useMediaRec;

  useEffect(() => {
    if (!enabled) {
      clearStream();
      clearMediaRecorder();
      return;
    }

    initScreenStream(selectedAudioDevice, { quality: recorderSettings.quality });
  }, [enabled]);

  useEffect(() => {
    if (!enabled || muteAudio || isMicDisabled) {
      return;
    }

    if (selectedAudioDevice) {
      initAudioStream(selectedAudioDevice, recorderSettings.quality);
    } else {
      initAudioStream(null, recorderSettings.quality);
    }
  }, [selectedAudioDevice, muteAudio, isMicDisabled, enabled]);

  useEffect(() => {
    if (!screenStream) {
      setMediaStream(null);
      mediaStreamRef.current = null;
      return;
    }

    if (screenStream) {
      const newStream = new MediaStream();
      [micStream, screenStream].forEach((stream) => {
        if (!stream) return;
        stream.getTracks().forEach((track) => newStream.addTrack(track));
      });
      setMediaStream(newStream);
      mediaStreamRef.current = newStream;
    }
  }, [screenStream, micStream]);

  useEffect(() => {
    requestNotificationPermission();
    return () => {
      clearStream();
      clearMediaRecorder();
    };
  }, []);

  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    setPlayerReady(false);
  }, [recordBlob]);

  useScreenTrackMonitor({
    screenStream,
    isRecording,
    onScreenShareEnded: recorderStop,
  });

  return {
    screenRef,
    screenStream,
    streamPermissionDenied,
    isRecording,
    formattedTimer,
    recordTimer,
    countdownRemaining,
    countDownStatus,
    isPaused,
    isStopped,
    isFinalizing,
    mediaRecorder,
    recordBlob,
    setRecordBlob,
    setRecordTimer,
    setIsStopped,
    recorderStart,
    recorderPause,
    recorderResume,
    recorderStop,
    downloadRecording,
    onCancelRecordingInit,
    clearStream,
    clearMediaRecorder,
    playerReady,
    setPlayerReady,
    reinitializeStreams,
    mediaStream,
  };
}
