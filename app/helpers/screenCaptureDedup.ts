/**
 * Dedupes concurrent getDisplayMedia calls (e.g. React Strict Mode double-mount).
 * Module singleton — see docs/browser-quirks.md.
 */
let screenCapturePromise: Promise<MediaStream> | null = null;

export function getScreenCapturePromise(): Promise<MediaStream> | null {
  return screenCapturePromise;
}

export function setScreenCapturePromise(promise: Promise<MediaStream> | null): void {
  screenCapturePromise = promise;
}

export function resetScreenCaptureDedup(): void {
  screenCapturePromise = null;
}
