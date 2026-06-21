"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { useTranslations } from "next-intl";

import { getWebcamSizeFraction } from "@/constants/recording";
import { clampWebcamOverlayCenter } from "@/helpers/screenWebcamCompositor";
import { getObjectContainRect } from "@/helpers/objectContainRect";
import { cn } from "@/lib/utils";
import type { WebcamOverlayPlacement } from "@/types/recording";

type DraggableWebcamPipProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  screenVideoRef: RefObject<HTMLVideoElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraStream: MediaStream | null;
  placement: WebcamOverlayPlacement;
  onPlacementChange: (placement: WebcamOverlayPlacement) => void;
  mirror: boolean;
  /** When true, PIP floats above the live canvas composite during recording. */
  overlayOnRecording?: boolean;
};

type PipStyle = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function computePipStyle(
  containerWidth: number,
  containerHeight: number,
  screenVideoWidth: number,
  screenVideoHeight: number,
  placement: WebcamOverlayPlacement,
): PipStyle | null {
  if (containerWidth <= 0 || containerHeight <= 0 || screenVideoWidth <= 0 || screenVideoHeight <= 0) {
    return null;
  }

  const content = getObjectContainRect(containerWidth, containerHeight, screenVideoWidth, screenVideoHeight);
  const diameter = content.height * getWebcamSizeFraction(placement.size);
  const { centerX, centerY } = clampWebcamOverlayCenter(
    placement.centerX,
    placement.centerY,
    placement.size,
    content.width,
    content.height,
  );

  const cx = content.x + centerX * content.width;
  const cy = content.y + centerY * content.height;

  return {
    left: cx - diameter / 2,
    top: cy - diameter / 2,
    width: diameter,
    height: diameter,
  };
}

function attachStreamToVideo(video: HTMLVideoElement, stream: MediaStream): void {
  if (video.srcObject !== stream) {
    video.srcObject = stream;
  }
  video.muted = true;
  video.playsInline = true;
  void video.play().catch(() => {});
}

export default function DraggableWebcamPip({
  containerRef,
  screenVideoRef,
  videoRef,
  cameraStream,
  placement,
  onPlacementChange,
  mirror,
  overlayOnRecording = false,
}: DraggableWebcamPipProps) {
  const tOverlay = useTranslations("webcamOverlay");
  const [pipStyle, setPipStyle] = useState<PipStyle | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startCenterX: number;
    startCenterY: number;
    contentWidth: number;
    contentHeight: number;
  } | null>(null);

  const bindVideoRef = useCallback(
    (element: HTMLVideoElement | null) => {
      videoRef.current = element;
      if (element && cameraStream) {
        attachStreamToVideo(element, cameraStream);
      }
    },
    [cameraStream, videoRef],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !cameraStream) {
      return;
    }
    attachStreamToVideo(video, cameraStream);
  }, [cameraStream, videoRef]);

  const updatePipStyle = useCallback(() => {
    const container = containerRef.current;
    const screenVideo = screenVideoRef.current;
    if (!container || !screenVideo) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const style = computePipStyle(
      rect.width,
      rect.height,
      screenVideo.videoWidth,
      screenVideo.videoHeight,
      placement,
    );
    setPipStyle(style);
  }, [containerRef, screenVideoRef, placement]);

  useEffect(() => {
    updatePipStyle();

    const container = containerRef.current;
    const screenVideo = screenVideoRef.current;
    if (!container) {
      return undefined;
    }

    const observer = new ResizeObserver(() => updatePipStyle());
    observer.observe(container);

    const onScreenMetadata = () => updatePipStyle();
    screenVideo?.addEventListener("loadedmetadata", onScreenMetadata);
    screenVideo?.addEventListener("resize", onScreenMetadata);

    return () => {
      observer.disconnect();
      screenVideo?.removeEventListener("loadedmetadata", onScreenMetadata);
      screenVideo?.removeEventListener("resize", onScreenMetadata);
    };
  }, [containerRef, screenVideoRef, updatePipStyle]);

  const getContentRect = useCallback(() => {
    const container = containerRef.current;
    const screenVideo = screenVideoRef.current;
    if (!container || !screenVideo || screenVideo.videoWidth === 0 || screenVideo.videoHeight === 0) {
      return null;
    }

    const rect = container.getBoundingClientRect();
    return getObjectContainRect(rect.width, rect.height, screenVideo.videoWidth, screenVideo.videoHeight);
  }, [containerRef, screenVideoRef]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const content = getContentRect();
    if (!content) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startCenterX: placement.centerX,
      startCenterY: placement.centerY,
      contentWidth: content.width,
      contentHeight: content.height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startClientX;
    const deltaY = event.clientY - drag.startClientY;
    const nextCenterX = drag.startCenterX + deltaX / drag.contentWidth;
    const nextCenterY = drag.startCenterY + deltaY / drag.contentHeight;
    const clamped = clampWebcamOverlayCenter(
      nextCenterX,
      nextCenterY,
      placement.size,
      drag.contentWidth,
      drag.contentHeight,
    );

    onPlacementChange({ ...placement, ...clamped });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (!cameraStream || !pipStyle) {
    return null;
  }

  return (
    <div
      className={cn("recorder__webcam_pip", overlayOnRecording && "recorder__webcam_pip--recording-overlay")}
      role="button"
      tabIndex={0}
      aria-label={tOverlay("dragWebcamAria")}
      style={{
        left: pipStyle.left,
        top: pipStyle.top,
        width: pipStyle.width,
        height: pipStyle.height,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <video
        ref={bindVideoRef}
        autoPlay
        playsInline
        muted
        aria-hidden="true"
        style={{ transform: mirror ? "scaleX(-1)" : undefined }}
      />
    </div>
  );
}
