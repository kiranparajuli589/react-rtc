import { useEffect, useLayoutEffect, useRef } from "react";

import { toast } from "sonner";
import { useTranslations } from "next-intl";

type UseScreenTrackMonitorArgs = {
  screenStream: MediaStream | null;
  isRecording: boolean;
  onScreenShareEnded: () => void;
};

/** Stops recording when the user ends screen sharing via the browser UI. */
export default function useScreenTrackMonitor({
  screenStream,
  isRecording,
  onScreenShareEnded,
}: UseScreenTrackMonitorArgs) {
  const tNotifications = useTranslations("notifications");
  const onEndedRef = useRef(onScreenShareEnded);

  useLayoutEffect(() => {
    onEndedRef.current = onScreenShareEnded;
  }, [onScreenShareEnded]);

  useEffect(() => {
    if (!screenStream || !isRecording) return undefined;

    const videoTrack = screenStream.getVideoTracks()[0];
    if (!videoTrack) return undefined;

    const handleEnded = () => {
      toast.info(tNotifications("screenShareEnded"));
      onEndedRef.current();
    };

    videoTrack.addEventListener("ended", handleEnded);
    return () => videoTrack.removeEventListener("ended", handleEnded);
  }, [screenStream, isRecording, tNotifications]);
}
