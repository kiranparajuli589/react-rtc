import { useRef, useState } from "react"

import { useTranslations } from "next-intl"

import { notifyRecordingStart } from "../desktopNotification"

type UseRecordingCountdownArgs = {
  onCountdownComplete: () => void
  onCountdownCancelled: () => void
}

export default function useRecordingCountdown({
  onCountdownComplete,
  onCountdownCancelled,
}: UseRecordingCountdownArgs) {
  const tNotifications = useTranslations("notifications")
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(
    null
  )
  const cancelRequestRef = useRef<boolean | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  )

  const countDownStatus = countdownRemaining !== null

  const clearCountdownInterval = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }

  const onCancelRecordingInit = () => {
    cancelRequestRef.current = true
    setCountdownRemaining(null)
    clearCountdownInterval()
  }

  const startCountdown = () => {
    clearCountdownInterval()
    notifyRecordingStart({
      countdownStart: tNotifications("countdownStart"),
      recordingStarted: tNotifications("recordingStarted"),
      recordingTitle: tNotifications("recordingTitle"),
    })
    setCountdownRemaining(3)

    const interval = setInterval(() => {
      if (cancelRequestRef.current) {
        setCountdownRemaining(null)
        clearInterval(interval)
        countdownIntervalRef.current = null
        onCountdownCancelled()
        return
      }

      setCountdownRemaining((prev) => {
        if (prev === null) return null
        if (prev <= 1) {
          clearInterval(interval)
          countdownIntervalRef.current = null
          onCountdownComplete()
          return null
        }
        return prev - 1
      })
    }, 1000)

    countdownIntervalRef.current = interval
  }

  const resetCountdown = () => {
    cancelRequestRef.current = null
    setCountdownRemaining(null)
    clearCountdownInterval()
  }

  return {
    countdownRemaining,
    setCountdownRemaining,
    countDownStatus,
    cancelRequestRef,
    startCountdown,
    onCancelRecordingInit,
    resetCountdown,
    clearCountdownInterval,
  }
}
