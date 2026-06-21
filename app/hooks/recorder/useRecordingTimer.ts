import { useEffect, useMemo, useRef, useState } from "react";

import { formatTime } from "@/core/mediaPlayer/utils";
import Config from "@/config";

type UseRecordingTimerArgs = {
  isRecording: boolean;
  isPaused: boolean;
  onLimitReached: () => void;
};

export default function useRecordingTimer({ isRecording, isPaused, onLimitReached }: UseRecordingTimerArgs) {
  const [recordTimer, setRecordTimer] = useState(0);
  const limit = useMemo(() => Config.RECORD_TIME_LIMIT_IN_SEC, []);
  const formattedTimer = useMemo(() => formatTime(recordTimer), [recordTimer]);

  const onLimitReachedRef = useRef(onLimitReached);
  onLimitReachedRef.current = onLimitReached;

  useEffect(() => {
    if (!isRecording || isPaused) return;
    const interval = setInterval(() => {
      setRecordTimer((prevTimer) => {
        if (prevTimer >= limit) {
          clearInterval(interval);
          onLimitReachedRef.current();
          return prevTimer;
        }
        return prevTimer + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, isPaused, limit]);

  const resetTimer = () => setRecordTimer(0);

  return {
    recordTimer,
    setRecordTimer,
    formattedTimer,
    limit,
    resetTimer,
  };
}
