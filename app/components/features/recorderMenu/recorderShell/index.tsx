"use client"

import type { ReactNode } from "react"

import { Loader2 } from "lucide-react"

import RecorderPreviewStage from "../previewStage"

import CountdownTimer from "@/core/countDown"
import Icon from "@/designSystem/icon"
import SkeletonBox from "@/skeletons/components/skeletonBox"

type RecorderShellProps = {
  toolbar: ReactNode
  headerSlot?: ReactNode
  countdownRemaining: number | null
  countDownStatus: boolean
  onCancelRecordingInit: () => void
  isFinalizing: boolean
  isStopped: boolean
  recordBlob: Blob | null
  isRecording: boolean
  isStreamReady?: boolean
  previewVariant?: "video" | "audio"
  previewContent: ReactNode
  livePreview: ReactNode
  skeletonHeight?: number | string
}

/** Shared recorder layout: toolbar, countdown, finalize skeleton, preview, and live capture slot. */
export default function RecorderShell({
  toolbar,
  headerSlot,
  countdownRemaining,
  countDownStatus,
  onCancelRecordingInit,
  isFinalizing,
  isStopped,
  recordBlob,
  isRecording,
  isStreamReady = false,
  previewVariant = "video",
  previewContent,
  livePreview,
  skeletonHeight = "100%",
}: RecorderShellProps) {
  const showPreview =
    isStopped && !!recordBlob && !isRecording && !countDownStatus
  const hideLive = showPreview || isFinalizing
  const showCountdown = countDownStatus && countdownRemaining !== null

  const countdownOverlay = showCountdown ? (
    <CountdownTimer
      count={countdownRemaining}
      onCancelStart={onCancelRecordingInit}
    />
  ) : null

  return (
    <>
      {toolbar}
      {headerSlot}
      <div className="recorder__preview_wrapper">
        {isFinalizing && isStopped && !recordBlob && (
          <RecorderPreviewStage variant={previewVariant} isStreamReady>
            <SkeletonBox
              height={skeletonHeight}
              backgroundColor="transparent"
              borderRadius={0}
              className="flex-centered h-full"
            >
              <Icon
                icon={Loader2}
                size={52}
                className="animate-spin text-muted-foreground"
              />
            </SkeletonBox>
          </RecorderPreviewStage>
        )}

        {showPreview && (
          <div className="recorder__preview_wrapper__preview">
            {previewContent}
          </div>
        )}

        {!hideLive && (
          <RecorderPreviewStage
            variant={previewVariant}
            isStreamReady={isStreamReady}
            countdownOverlay={countdownOverlay}
          >
            {livePreview}
          </RecorderPreviewStage>
        )}
      </div>
    </>
  )
}
