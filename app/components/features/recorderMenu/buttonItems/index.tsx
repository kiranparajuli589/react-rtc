"use client"

import type { LucideIcon } from "lucide-react"
import { ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useConfirm } from "@/contexts/confirmDialogContext"
import Icon from "@/designSystem/icon"
import { cn } from "@/lib/utils"

type BackButtonProps = {
  onClick: () => void
  isBlobAvailable?: boolean
}

export function BackButton({
  onClick,
  isBlobAvailable = false,
}: BackButtonProps) {
  const confirm = useConfirm()
  const tCommon = useTranslations("common")
  const tConfirm = useTranslations("confirm")

  return (
    <div className="recorder_menu__toolbar__back__wrapper">
      <Button
        type="button"
        className="recorder_menu__toolbar__back h-auto p-2"
        size="icon"
        aria-label={tCommon("goBack")}
        onClick={async () => {
          if (isBlobAvailable) {
            const ok = await confirm({
              title: tConfirm("leaveTitle"),
              description: tConfirm("leaveDescription"),
              confirmLabel: tConfirm("goBack"),
              cancelLabel: tCommon("stay"),
              destructive: true,
            })
            if (!ok) return
          }
          onClick()
        }}
      >
        <ArrowLeft />
      </Button>
      <h1 className="font-medium text-foreground">{tCommon("appName")}</h1>
    </div>
  )
}

type RecorderActionButtonProps = {
  icon: LucideIcon
  label: string
  disabled?: boolean
  onClick?: () => void
  className?: string
  title?: string
}

const RECORDING_ACTION_APPEARANCE: Record<string, string> = {
  start_recording_button: cn(
    "!border-red-200 !bg-red-50 !text-red-700 shadow-none",
    "hover:!border-red-300 hover:!bg-red-100 hover:!text-red-800",
    "focus-visible:!border-red-400 focus-visible:ring-red-400/45",
    "active:!border-red-400 active:!bg-red-200 active:!text-red-900",
    "dark:!border-red-900 dark:!bg-red-950 dark:!text-red-300",
    "dark:hover:!border-red-700 dark:hover:!bg-red-900 dark:hover:!text-red-200",
    "dark:focus-visible:!border-red-500 dark:focus-visible:ring-red-500/45",
    "dark:active:!border-red-600 dark:active:!bg-red-950 dark:active:!text-red-100"
  ),
  stop_recording_button: cn(
    "!border-rose-200 !bg-rose-50 !text-rose-700 shadow-none",
    "hover:!border-rose-300 hover:!bg-rose-100 hover:!text-rose-800",
    "focus-visible:!border-rose-400 focus-visible:ring-rose-400/45",
    "active:!border-rose-400 active:!bg-rose-200 active:!text-rose-900",
    "dark:!border-rose-900 dark:!bg-rose-950 dark:!text-rose-300",
    "dark:hover:!border-rose-700 dark:hover:!bg-rose-900 dark:hover:!text-rose-200",
    "dark:focus-visible:!border-rose-500 dark:focus-visible:ring-rose-500/45",
    "dark:active:!border-rose-600 dark:active:!bg-rose-950 dark:active:!text-rose-100"
  ),
  pause_recording_button: cn(
    "!border-amber-200 !bg-amber-50 !text-amber-700 shadow-none",
    "hover:!border-amber-300 hover:!bg-amber-100 hover:!text-amber-800",
    "focus-visible:!border-amber-400 focus-visible:ring-amber-400/45",
    "active:!border-amber-400 active:!bg-amber-200 active:!text-amber-900",
    "dark:!border-amber-900 dark:!bg-amber-950 dark:!text-amber-300",
    "dark:hover:!border-amber-700 dark:hover:!bg-amber-900 dark:hover:!text-amber-200",
    "dark:focus-visible:!border-amber-500 dark:focus-visible:ring-amber-500/45",
    "dark:active:!border-amber-600 dark:active:!bg-amber-950 dark:active:!text-amber-100"
  ),
  resume_recording_button: cn(
    "!border-green-200 !bg-green-50 !text-green-700 shadow-none",
    "hover:!border-green-300 hover:!bg-green-100 hover:!text-green-800",
    "focus-visible:!border-green-400 focus-visible:ring-green-400/45",
    "active:!border-green-400 active:!bg-green-200 active:!text-green-900",
    "dark:!border-green-900 dark:!bg-green-950 dark:!text-green-300",
    "dark:hover:!border-green-700 dark:hover:!bg-green-900 dark:hover:!text-green-200",
    "dark:focus-visible:!border-green-500 dark:focus-visible:ring-green-500/45",
    "dark:active:!border-green-600 dark:active:!bg-green-950 dark:active:!text-green-100"
  ),
  restart_recording_button: cn(
    "!border-blue-200 !bg-blue-50 !text-blue-700 shadow-none",
    "hover:!border-blue-300 hover:!bg-blue-100 hover:!text-blue-800",
    "focus-visible:!border-blue-400 focus-visible:ring-blue-400/45",
    "active:!border-blue-400 active:!bg-blue-200 active:!text-blue-900",
    "dark:!border-blue-900 dark:!bg-blue-950 dark:!text-blue-300",
    "dark:hover:!border-blue-700 dark:hover:!bg-blue-900 dark:hover:!text-blue-200",
    "dark:focus-visible:!border-blue-500 dark:focus-visible:ring-blue-500/45",
    "dark:active:!border-blue-600 dark:active:!bg-blue-950 dark:active:!text-blue-100"
  ),
}

function resolveRecordingActionAppearance(
  className: string
): string | undefined {
  const key = Object.keys(RECORDING_ACTION_APPEARANCE).find((name) =>
    className.includes(name)
  )
  return key ? RECORDING_ACTION_APPEARANCE[key] : undefined
}

export function RecorderActionButton({
  icon,
  label,
  disabled,
  onClick,
  className = "",
  title = "",
}: RecorderActionButtonProps) {
  const recordingAppearance = resolveRecordingActionAppearance(className)
  const isRecordingAction = Boolean(recordingAppearance)
  const button = (
    <Button
      type="button"
      variant={isRecordingAction ? "outline" : "ghost"}
      disabled={disabled}
      className={cn(
        "h-auto gap-1",
        isRecordingAction && "recording-action-btn px-3 py-1 font-semibold",
        recordingAppearance,
        className
      )}
      onClick={onClick}
      aria-label={title || label}
    >
      <Icon icon={icon} className="ml-1" size={32} />
      <span className="label text-xs">{label}</span>
    </Button>
  )

  if (title && title !== label) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </Tooltip>
    )
  }

  return button
}
