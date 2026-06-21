/**
 * Schedules canvas/video work synced to the compositor video frame rate.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback
 */
type VideoFrameCallback = (timestamp: number) => void;

export const CAPTURE_TARGET_FPS = 30;

export const shouldDrawThisFrame = (lastDrawMs: number, targetFps = CAPTURE_TARGET_FPS): boolean => {
  return performance.now() - lastDrawMs >= 1000 / targetFps;
};

export const requestVideoFrame = (video: HTMLVideoElement | null, callback: VideoFrameCallback): number => {
  if (video && "requestVideoFrameCallback" in video) {
    return video.requestVideoFrameCallback(() => {
      callback(performance.now());
    });
  }

  return window.requestAnimationFrame(() => {
    callback(performance.now());
  });
};

export const cancelVideoFrame = (video: HTMLVideoElement | null, id: number): void => {
  if (video && "cancelVideoFrameCallback" in video) {
    video.cancelVideoFrameCallback(id);
    return;
  }

  window.cancelAnimationFrame(id);
};
