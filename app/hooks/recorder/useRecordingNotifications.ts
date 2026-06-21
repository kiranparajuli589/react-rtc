import { useRef } from "react";

import { useTranslations } from "next-intl";

import { notifyMe, buildStreamInitNotificationMap } from "../desktopNotification";

import type { RecordingType } from "@/constants/recordingTypes";
import ConsoleLogger from "@/helpers/consoleLogger";

type UseRecordingNotificationsArgs = {
  type: RecordingType;
  isRecordingRef: React.RefObject<boolean>;
};

export default function useRecordingNotifications({ type, isRecordingRef }: UseRecordingNotificationsArgs) {
  const tNotifications = useTranslations("notifications");
  const intervalNotificationRef = useRef<{ close?: () => void } | null>(null);
  const niProcessTimeoutIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const streamInitMap = buildStreamInitNotificationMap({
    audio: tNotifications("streamReadyAudio"),
    video: tNotifications("streamReadyVideo"),
    screen: tNotifications("streamReadyScreen"),
    screenVideo: tNotifications("streamReadyScreenVideo"),
  });

  const nudgeMessages = [tNotifications("nudgeReminder"), tNotifications("nudgeHello")];
  const recordingTitle = tNotifications("recordingTitle");

  const stopNotificationProcess = () => {
    if (niProcessTimeoutIdRef.current) {
      clearInterval(niProcessTimeoutIdRef.current);
      niProcessTimeoutIdRef.current = null;
    }
    if (intervalNotificationRef.current?.close) {
      intervalNotificationRef.current.close();
    }
  };

  const startNotificationProcess = (): ReturnType<typeof setInterval> => {
    ConsoleLogger.info("Starting notification process");
    const intervalIdRef: { current: ReturnType<typeof setInterval> | null } = { current: null };
    let messageIndex = 0;
    const messages = [streamInitMap[type], ...nudgeMessages];

    function notify() {
      if (isRecordingRef.current === true) {
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
        }
        return;
      }

      if (messageIndex < messages.length) {
        const message = messages[messageIndex];
        intervalNotificationRef.current = notifyMe(message, recordingTitle) as { close?: () => void } | null;

        setTimeout(() => {
          if (typeof intervalNotificationRef.current?.close === "function") {
            intervalNotificationRef.current.close();
          }
        }, 5 * 1000);

        messageIndex++;
      } else if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    }

    notify();
    intervalIdRef.current = setInterval(notify, 10 * 1000);
    niProcessTimeoutIdRef.current = intervalIdRef.current;
    return intervalIdRef.current;
  };

  return {
    startNotificationProcess,
    stopNotificationProcess,
    niProcessTimeoutIdRef,
  };
}
