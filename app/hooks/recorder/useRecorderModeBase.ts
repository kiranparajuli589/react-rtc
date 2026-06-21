import { useEffect, useRef, useState } from "react";

import { requestNotificationPermission } from "../desktopNotification";
import useMediaRecorder from "../useMediaRecorder";
import useStream from "../useStream";

import type { RecordingType } from "@/constants/recordingTypes";
import type { RecorderSettings } from "@/types/recording";

type UseRecorderModeBaseArgs = {
  recordingType: RecordingType;
  recorderSettings: RecorderSettings;
  clearStream: () => void;
  reinitializeStreams: () => void;
  isMicDisabled: boolean;
  canvasCaptureFrameRate?: number;
};

/** Shared wiring for mode-specific recorder hooks. */
export default function useRecorderModeBase({
  recordingType,
  recorderSettings,
  clearStream,
  reinitializeStreams,
  isMicDisabled,
  canvasCaptureFrameRate,
}: UseRecorderModeBaseArgs) {
  const [playerReady, setPlayerReady] = useState(false);

  const mediaRecorder = useMediaRecorder({
    type: recordingType,
    withCountdown: recorderSettings.countDown,
    clearStream,
    reinitializeStreams,
    isMicDisabled,
    canvasCaptureFrameRate,
  });

  useEffect(() => {
    requestNotificationPermission();
    return () => {
      clearStream();
      mediaRecorder.clearMediaRecorder();
    };
  }, []);

  useEffect(() => {
    setPlayerReady(false);
  }, [mediaRecorder.recordBlob]);

  return {
    playerReady,
    setPlayerReady,
    ...mediaRecorder,
  };
}

export function useStreamWithCleanup() {
  const stream = useStream();

  const clearStreamAndRefs = () => {
    stream.clearStream();
  };

  return { ...stream, clearStream: clearStreamAndRefs };
}
