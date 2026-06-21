"use client"

import { useEffect, useRef, useState } from "react"

import {
  Check,
  ChevronDown,
  Film,
  FlipHorizontal2,
  Loader2,
  Mic,
  MicOff,
  Settings2,
  Sparkles,
  Timer,
  Video,
  VideoOff,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  MEDIA_DEVICE,
  PERMISSION_STATE,
  QualityMap,
} from "@/constants/recording"
import Icon from "@/designSystem/icon"
import { isMobile } from "@/helpers/browserHelper"
import { usePermissionStatus } from "@/hooks/usePermissionStatus"
import useRecordingDevices from "@/hooks/useRecordingDevices"
import { useIsClient } from "@/hooks/useIsClient"
import type { RecorderSettings, RecordingDevice } from "@/types/recording"
import type { RecordingActionsProps } from "@/types/recorder"

type DeviceType = "audio" | "video"

export default function RecordingActions(props: RecordingActionsProps) {
  const {
    disabled,
    selectedVideoDevice,
    selectedAudioDevice,
    setSelectedAudioDevice,
    setSelectedVideoDevice,
    setIsMicDisabled,
    setIsCameraDisabled,
    setRecorderSettings,
    setIsRequestingPermissions,
    selectedRecordingOption,
    setDevicesList,
  } = props

  const tCommon = useTranslations("common")
  const tPermissions = useTranslations("permissions")
  const tSettings = useTranslations("settings")

  const {
    audioDevices,
    videoDevices,
    isMicPermissionDenied,
    isCameraPermissionDenied,
    isEnumerating,
    isRequestingPermission,
  } = useRecordingDevices({
    selectedAudioDevice,
    setSelectedAudioDevice,
    selectedVideoDevice,
    setSelectedVideoDevice,
  })

  useEffect(() => {
    if (audioDevices.length > 0 && videoDevices.length > 0) {
      setDevicesList({ audioDevices, videoDevices })
    }
  }, [audioDevices, videoDevices, setDevicesList])

  useEffect(() => {
    setIsRequestingPermissions(isRequestingPermission)
  }, [isRequestingPermission, setIsRequestingPermissions])

  useEffect(() => {
    setIsMicDisabled(!!isMicPermissionDenied)
    setIsCameraDisabled(!!isCameraPermissionDenied)
  }, [
    isMicPermissionDenied,
    isCameraPermissionDenied,
    setIsMicDisabled,
    setIsCameraDisabled,
  ])

  const { isPermissionAPIAvailable, permissionStatus: audioPermissionStatus } =
    usePermissionStatus(MEDIA_DEVICE.AUDIO)
  const { permissionStatus: videoPermissionStatus } = usePermissionStatus(
    MEDIA_DEVICE.VIDEO
  )

  useEffect(() => {
    if (isPermissionAPIAvailable) {
      setIsMicDisabled(audioPermissionStatus !== PERMISSION_STATE.GRANTED)
      setIsCameraDisabled(videoPermissionStatus !== PERMISSION_STATE.GRANTED)
    }
  }, [
    audioPermissionStatus,
    videoPermissionStatus,
    isPermissionAPIAvailable,
    setIsMicDisabled,
    setIsCameraDisabled,
  ])

  const isMounted = useIsClient()

  const [settings, setSettings] = useState<RecorderSettings>({
    mirror: true,
    countDown: true,
    quality: QualityMap.Medium,
  })
  const previousQualityRef = useRef(settings.quality)

  useEffect(() => {
    setRecorderSettings(settings)
  }, [settings, setRecorderSettings])

  useEffect(() => {
    if (
      previousQualityRef.current !== settings.quality &&
      selectedRecordingOption
    ) {
      toast.info(tSettings("qualityRestartToast"))
    }
    previousQualityRef.current = settings.quality
  }, [settings.quality, selectedRecordingOption, tSettings])

  const getDeviceButtonDisabledStatus = (deviceType: DeviceType) => {
    if (isPermissionAPIAvailable === true) {
      return deviceType === "audio"
        ? audioPermissionStatus === PERMISSION_STATE.DENIED
        : videoPermissionStatus === PERMISSION_STATE.DENIED
    }
    if (isPermissionAPIAvailable === false) {
      return deviceType === "audio"
        ? isMicPermissionDenied
        : isCameraPermissionDenied
    }
    return false
  }

  const showDeviceLoading =
    isMounted && (isEnumerating || isRequestingPermission)

  const getDeviceLabel = (
    devices: RecordingDevice[],
    selectedDeviceId: string | null
  ) => devices.find((device) => device.deviceId === selectedDeviceId)?.label

  const deviceMenu = (
    deviceType: DeviceType,
    devices: RecordingDevice[],
    selectedDeviceId: string | null
  ) => {
    const isDenied = getDeviceButtonDisabledStatus(deviceType)
    const DeviceIcon = isDenied
      ? deviceType === "audio"
        ? MicOff
        : VideoOff
      : deviceType === "audio"
        ? Mic
        : Video
    const label = getDeviceLabel(devices, selectedDeviceId)

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="recorder_menu__actions__button h-auto gap-2 px-3 py-2"
            disabled={isDenied}
            aria-label={
              deviceType === "audio"
                ? tPermissions("selectAudioDevice")
                : tPermissions("selectVideoDevice")
            }
          >
            {showDeviceLoading ? (
              <>
                <Icon icon={Loader2} className="animate-spin" size={26} />
                <span className="h-2 w-20 animate-pulse rounded bg-slate-300" />
              </>
            ) : (
              <>
                <Icon icon={DeviceIcon} size={26} />
                <span className="min-w-12 truncate">
                  {isDenied
                    ? tCommon("permissionDenied")
                    : label ||
                      (deviceType === "audio"
                        ? tCommon("selectAudio")
                        : tCommon("selectVideo"))}
                </span>
                <Icon icon={ChevronDown} size={24} />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[220px]" align="start" side="top">
          {!!devices.length && devices[0].label === "" && (
            <>
              <DropdownMenuLabel className="text-xs leading-snug font-normal">
                {tPermissions("deviceIdsHint")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          {devices.map((device) => {
            const isSelected = selectedDeviceId === device.deviceId
            return (
              <DropdownMenuItem
                key={device.deviceId}
                className={cn(isSelected && "bg-accent")}
                onSelect={() => {
                  if (deviceType === "audio")
                    setSelectedAudioDevice(device.deviceId)
                  else setSelectedVideoDevice(device.deviceId)
                }}
              >
                <Check
                  className={cn(
                    "size-4",
                    isSelected ? "opacity-100" : "opacity-0"
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">
                  {device.label || device.deviceId}
                </span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const [messagesDismissed, setMessagesDismissed] = useState(false)
  const showMessages = !selectedRecordingOption || !messagesDismissed

  const hasPermissionDenied =
    isPermissionAPIAvailable === true
      ? audioPermissionStatus === PERMISSION_STATE.DENIED ||
        videoPermissionStatus === PERMISSION_STATE.DENIED
      : isPermissionAPIAvailable === false &&
        (isMicPermissionDenied || isCameraPermissionDenied)

  const shouldShowPermissionMessages =
    isMounted && showMessages && hasPermissionDenied
  const qualityDisabled = Boolean(selectedRecordingOption)

  return (
    <>
      {shouldShowPermissionMessages ? (
        <Alert
          className="recorder_menu__messages relative mx-auto max-w-3xl"
          role="alert"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="recorder_menu__messages__close absolute top-2 right-2"
            aria-label={tPermissions("dismiss")}
            onClick={() => setMessagesDismissed(true)}
          >
            <Icon icon={X} size={24} />
          </Button>
          <AlertTitle>{tPermissions("required")}</AlertTitle>
          <AlertDescription className="space-y-2">
            {(isPermissionAPIAvailable
              ? audioPermissionStatus !== PERMISSION_STATE.GRANTED
              : isMicPermissionDenied) && (
              <p>{tPermissions("microphoneDenied")}</p>
            )}
            {(isPermissionAPIAvailable
              ? videoPermissionStatus !== PERMISSION_STATE.GRANTED
              : isCameraPermissionDenied) && (
              <p>{tPermissions("cameraDenied")}</p>
            )}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() => window.location.reload()}
            >
              {tPermissions("reload")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        !selectedRecordingOption && (
          <div className="h-[100px]" aria-hidden="true" />
        )
      )}

      <div
        className={`recorder_menu__actions ${disabled ? "disable_actions" : ""}`}
      >
        <div className="recorder_menu__actions__controls">
          {deviceMenu("audio", audioDevices, selectedAudioDevice)}
          {deviceMenu("video", videoDevices, selectedVideoDevice)}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="recorder_menu__actions__button h-auto gap-2 px-3 py-2"
                aria-label={tSettings("ariaLabel")}
              >
                <Icon icon={Settings2} size={26} />
                <span>{tCommon("settings")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[240px] p-4" align="start">
              <fieldset>
                <legend className="mb-3 text-sm font-medium">
                  {tSettings("legend")}
                </legend>
                <div className="settings_dropdown__label flex items-center justify-between gap-4 py-2">
                  <div className="settings_dropdown__label__info flex items-center gap-2">
                    <Icon icon={FlipHorizontal2} size={22} />
                    <Label htmlFor="setting-mirror">
                      {tSettings("mirrorCamera")}
                    </Label>
                  </div>
                  <Switch
                    id="setting-mirror"
                    checked={settings.mirror}
                    onCheckedChange={(mirror) =>
                      setSettings((prev) => ({ ...prev, mirror }))
                    }
                  />
                </div>
                <div className="settings_dropdown__label flex items-center justify-between gap-4 py-2">
                  <div className="settings_dropdown__label__info flex items-center gap-2">
                    <Icon icon={Timer} size={22} />
                    <Label htmlFor="setting-countdown">
                      {tSettings("countdown")}
                    </Label>
                  </div>
                  <Switch
                    id="setting-countdown"
                    checked={settings.countDown}
                    onCheckedChange={(countDown) =>
                      setSettings((prev) => ({ ...prev, countDown }))
                    }
                  />
                </div>
              </fieldset>

              {!isMobile() && (
                <fieldset className="mt-4 border-t pt-4">
                  <legend className="mb-2 text-sm font-medium">
                    {tSettings("videoQualityLegend")}
                  </legend>
                  <p className="mb-3 text-xs text-muted-foreground">
                    {tSettings("videoQualityHint")}
                  </p>
                  <DropdownMenuRadioGroup
                    value={settings.quality ?? QualityMap.Medium}
                    onValueChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        quality: value as typeof QualityMap.Medium,
                      }))
                    }
                  >
                    <DropdownMenuRadioItem
                      value={QualityMap.Medium}
                      disabled={qualityDisabled}
                    >
                      <Icon icon={Film} size={18} className="mr-2" />
                      {tSettings("mediumQuality")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value={QualityMap.High}
                      disabled={qualityDisabled}
                    >
                      <Icon icon={Sparkles} size={18} className="mr-2" />
                      {tSettings("highQuality")}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </fieldset>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )
}
