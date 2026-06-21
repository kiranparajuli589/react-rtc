import { useCallback, useEffect, useState } from "react"

import { toast } from "sonner"
import { useTranslations } from "next-intl"

import { requestNotificationPermission } from "./desktopNotification"

import ConsoleLogger from "@/helpers/consoleLogger"
import useLatestRef from "@/hooks/useLatestRef"
import type { RecordingDevice } from "@/types/recording"

type UseRecordingDevicesArgs = {
  selectedAudioDevice: string | null
  setSelectedAudioDevice?: (deviceId: string) => void
  selectedVideoDevice: string | null
  setSelectedVideoDevice?: (deviceId: string) => void
  config?: MediaStreamConstraints
  pemDeniedMessage?: string
}

const isEnumerateSupported = (): boolean =>
  typeof navigator !== "undefined" &&
  !!navigator.mediaDevices &&
  typeof navigator.mediaDevices.enumerateDevices === "function"

export default function useRecordingDevices({
  selectedAudioDevice,
  setSelectedAudioDevice,
  selectedVideoDevice,
  setSelectedVideoDevice,
  config = { audio: true, video: true },
  pemDeniedMessage = "Permission denied to access the microphone/camera.",
}: UseRecordingDevicesArgs) {
  const tDevices = useTranslations("devices")
  const enumerateSupported = isEnumerateSupported()
  const [audioDevices, setAudioDevices] = useState<RecordingDevice[]>([])
  const [videoDevices, setVideoDevices] = useState<RecordingDevice[]>([])
  const [isMicPermissionDenied, setIsMicPermissionDenied] = useState(false)
  const [isCameraPermissionDenied, setIsCameraPermissionDenied] =
    useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [isEnumerating, setIsEnumerating] = useState(false)

  const enumerateDevices = useCallback(async () => {
    setIsEnumerating(true)
    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioInputs: RecordingDevice[] = [
      ...devices.filter((device) => device.kind === "audioinput"),
      { deviceId: "PureAudio", label: tDevices("pureAudio") },
    ]
    const videoInputs = devices.filter((device) => device.kind === "videoinput")

    setAudioDevices(audioInputs)
    setVideoDevices(videoInputs)

    const pickDevice = (
      devices: RecordingDevice[],
      current: string | null,
      setter: ((deviceId: string) => void) | undefined
    ) => {
      if (devices.length === 0 || !setter) return
      const isValid =
        current !== null && devices.some((d) => d.deviceId === current)
      if (!isValid) setter(devices[0].deviceId)
    }

    pickDevice(audioInputs, selectedAudioDevice, setSelectedAudioDevice)
    pickDevice(videoInputs, selectedVideoDevice, setSelectedVideoDevice)
    setIsEnumerating(false)
    setIsRequestingPermission(false)
  }, [
    selectedAudioDevice,
    selectedVideoDevice,
    setSelectedAudioDevice,
    setSelectedVideoDevice,
    tDevices,
  ])

  const handleEnumerationUsingMediaStream = useCallback(async () => {
    ConsoleLogger.debug(
      "Requesting permission to access the camera/microphone."
    )
    setIsRequestingPermission(true)
    await navigator.mediaDevices
      .getUserMedia(config)
      .then((stream) => {
        ConsoleLogger.info(
          "Permission granted to access the camera/microphone."
        )
        setIsMicPermissionDenied(false)
        setIsCameraPermissionDenied(false)
        stream.getTracks().forEach((track) => track.stop())
      })
      .catch((error: DOMException) => {
        if (error.name === "NotAllowedError") {
          toast.error(pemDeniedMessage)
          setIsMicPermissionDenied(true)
          setIsCameraPermissionDenied(true)
        } else {
          ConsoleLogger.error(error)
        }
      })
      .finally(async () => {
        setIsRequestingPermission(false)
        await enumerateDevices()
        requestNotificationPermission()
      })
  }, [config, enumerateDevices, pemDeniedMessage])

  const enumerateDevicesRef = useLatestRef(enumerateDevices)
  const handleEnumerationRef = useLatestRef(handleEnumerationUsingMediaStream)

  useEffect(() => {
    ConsoleLogger.info("Checking enumerate support")

    if (!enumerateSupported) {
      return
    }

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      if (devices.some((device) => device.label === "")) {
        void handleEnumerationRef.current()
      } else {
        void enumerateDevicesRef.current()
      }
    })
  }, [enumerateSupported, enumerateDevicesRef, handleEnumerationRef])

  return {
    isEnumerateSupported: enumerateSupported,
    audioDevices,
    videoDevices,
    isMicPermissionDenied,
    isCameraPermissionDenied,
    handleEnumerationUsingMediaStream,
    isEnumerating,
    setIsEnumerating,
    isRequestingPermission,
    selectedAudioDevice,
    setSelectedAudioDevice,
    selectedVideoDevice,
    setSelectedVideoDevice,
  }
}
