import {
  ScreenWebcamConfig,
  getWebcamSizeFraction,
} from "@/constants/recording"
import type {
  WebcamOverlayPlacement,
  WebcamOverlaySize,
} from "@/types/recording"

export type CompositorLayout = {
  canvasWidth: number
  canvasHeight: number
  webcamWidth: number
  webcamHeight: number
  x: number
  y: number
}

export function clampWebcamOverlayCenter(
  centerX: number,
  centerY: number,
  size: WebcamOverlaySize,
  screenWidth: number,
  screenHeight: number
): { centerX: number; centerY: number } {
  if (screenWidth <= 0 || screenHeight <= 0) {
    return { centerX, centerY }
  }

  const diameter = screenHeight * getWebcamSizeFraction(size)
  const half = diameter / 2
  const cx = centerX * screenWidth
  const cy = centerY * screenHeight
  const clampedCx = Math.min(Math.max(cx, half), screenWidth - half)
  const clampedCy = Math.min(Math.max(cy, half), screenHeight - half)

  return {
    centerX: clampedCx / screenWidth,
    centerY: clampedCy / screenHeight,
  }
}

export function computeWebcamOverlayRect(
  placement: WebcamOverlayPlacement,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number; width: number; height: number } {
  const diameter = screenHeight * getWebcamSizeFraction(placement.size)
  const { centerX, centerY } = clampWebcamOverlayCenter(
    placement.centerX,
    placement.centerY,
    placement.size,
    screenWidth,
    screenHeight
  )

  const cx = centerX * screenWidth
  const cy = centerY * screenHeight

  return {
    x: cx - diameter / 2,
    y: cy - diameter / 2,
    width: diameter,
    height: diameter,
  }
}

export const computeCompositorLayout = (
  screenWidth: number,
  screenHeight: number,
  placement: WebcamOverlayPlacement
): CompositorLayout => {
  const { x, y, width, height } = computeWebcamOverlayRect(
    placement,
    screenWidth,
    screenHeight
  )

  return {
    canvasWidth: screenWidth,
    canvasHeight: screenHeight,
    webcamWidth: width,
    webcamHeight: height,
    x,
    y,
  }
}

type DrawScreenWebcamFrameArgs = {
  context: CanvasRenderingContext2D
  screenVideo: HTMLVideoElement
  webcamVideo: HTMLVideoElement
  layout: CompositorLayout
  mirrorWebcam: boolean
}

/** Draws screen only — used when webcam has not produced frames yet. */
export const drawScreenOnlyFrame = (
  context: CanvasRenderingContext2D,
  screenVideo: HTMLVideoElement,
  canvasWidth: number,
  canvasHeight: number
): void => {
  context.drawImage(screenVideo, 0, 0, canvasWidth, canvasHeight)
}

/** Draws one composited frame (screen + circular webcam overlay) onto a canvas. */
export const drawScreenWebcamFrame = ({
  context,
  screenVideo,
  webcamVideo,
  layout,
  mirrorWebcam,
}: DrawScreenWebcamFrameArgs): void => {
  const { canvasWidth, canvasHeight, webcamWidth, webcamHeight, x, y } = layout

  context.drawImage(screenVideo, 0, 0, canvasWidth, canvasHeight)

  if (webcamVideo.videoWidth === 0 || webcamVideo.videoHeight === 0) {
    return
  }

  const radius = webcamWidth / 2
  const centerX = x + radius
  const centerY = y + radius

  context.save()
  context.beginPath()
  context.arc(centerX, centerY, radius, 0, Math.PI * 2, true)
  context.closePath()
  context.strokeStyle = ScreenWebcamConfig.borderColor
  context.lineWidth = ScreenWebcamConfig.borderWidth
  context.stroke()
  context.clip()

  if (mirrorWebcam) {
    context.save()
    context.translate(canvasWidth, 0)
    context.scale(-1, 1)
    context.drawImage(
      webcamVideo,
      canvasWidth - x - webcamWidth,
      y,
      webcamWidth,
      webcamHeight
    )
    context.restore()
  } else {
    context.drawImage(webcamVideo, x, y, webcamWidth, webcamHeight)
  }

  context.restore()
}
