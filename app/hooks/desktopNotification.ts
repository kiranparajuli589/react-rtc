"use client"

import { RECORDING_TYPE, type RecordingType } from "@/constants/recordingTypes"
import { BRAND_NAME, BRAND_TAG } from "@/constants/brand"
import Config from "@/config"
import { PERMISSION_STATE } from "@/constants/recording"
import ConsoleLogger from "@/helpers/consoleLogger"

/** Legacy notification glue returns nothing useful; callers only probe `.close()`. */
export type NotificationResult = void | null | Promise<NotificationResult>

type NotificationStatics = typeof Notification & {
  close?: () => void
  clear?: () => void
}

function showNotification(message: string, title = BRAND_NAME): void {
  navigator.serviceWorker.ready
    .then((registration) => {
      registration
        .showNotification(message, {
          body: title,
          icon: new URL("app_fav.png", Config.BASE_URL).href,
          tag: BRAND_TAG,
        })
        .catch((error) => {
          ConsoleLogger.error("Error showing notification: ", error)
        })
    })
    .catch((err) => {
      ConsoleLogger.warn("Service worker not ready:", err)
    })
}

function clearNotifications(): void {
  navigator.serviceWorker.ready.then((registration) => {
    registration.getNotifications().then((notifications) => {
      notifications.forEach((notification) => {
        notification.close()
      })
    })
  })
}

export function notifyMe(
  message: string,
  title = BRAND_NAME
): NotificationResult {
  if (!("Notification" in window)) {
    ConsoleLogger.warn("This browser does not support desktop notification")
    return null
  } else if (Notification.permission === PERMISSION_STATE.GRANTED) {
    const NotificationCtor = Notification as NotificationStatics
    NotificationCtor.close?.()
    NotificationCtor.clear?.()

    clearNotifications()
    return showNotification(message, title)
  } else if (Notification.permission !== PERMISSION_STATE.DENIED) {
    return Notification.requestPermission().then(() => {
      return notifyMe(message, title)
    })
  }
}

export function requestNotificationPermission(): void {
  if (!("Notification" in window)) {
    ConsoleLogger.warn("This browser does not support desktop notification")
  } else if (Notification.permission !== PERMISSION_STATE.GRANTED) {
    ConsoleLogger.info("Requesting permission for desktop notification")
    Notification.requestPermission()
      .then((permission) => {
        ConsoleLogger.info("Permission for desktop notification: ", permission)
      })
      .catch((error) => {
        ConsoleLogger.warn(
          "Failed to request permission for desktop notification",
          error
        )
      })
  }
}

export type StreamInitMessages = {
  audio: string
  video: string
  screen: string
  screenVideo: string
}

export function buildStreamInitNotificationMap(
  messages: StreamInitMessages
): Record<RecordingType, string> {
  return {
    [RECORDING_TYPE.AUDIO]: messages.audio,
    [RECORDING_TYPE.VIDEO]: messages.video,
    [RECORDING_TYPE.SCREEN]: messages.screen,
    [RECORDING_TYPE.SCREEN_VIDEO]: messages.screenVideo,
  }
}

export type RecordingStartMessages = {
  countdownStart: string
  recordingStarted: string
  recordingTitle: string
}

export function notifyRecordingStart(messages: RecordingStartMessages): void {
  notifyMe(messages.countdownStart, messages.recordingTitle)
  setTimeout(() => {
    clearNotifications()
    notifyMe(messages.recordingStarted, messages.recordingTitle)
    setTimeout(() => {
      clearNotifications()
    }, 2000)
  }, 3000)
}
