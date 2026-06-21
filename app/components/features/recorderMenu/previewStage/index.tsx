"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PreviewStageVariant = "video" | "audio";

type RecorderPreviewStageProps = {
  variant?: PreviewStageVariant;
  isStreamReady?: boolean;
  countdownOverlay?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Fixed-size preview frame — reserves space before the media stream is ready (zero layout shift). */
export default function RecorderPreviewStage({
  variant = "video",
  isStreamReady = false,
  countdownOverlay,
  className,
  children,
}: RecorderPreviewStageProps) {
  return (
    <div
      className={cn(
        "recorder__preview_stage",
        variant === "audio" && "recorder__preview_stage--audio",
        className,
      )}
    >
      {!isStreamReady && !countdownOverlay && <div className="recorder__preview_stage__placeholder" aria-hidden="true" />}
      <div className="recorder__preview_stage__content">{children}</div>
      {countdownOverlay}
    </div>
  );
}
