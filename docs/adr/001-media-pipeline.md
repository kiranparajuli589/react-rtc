# ADR 001: Media capture pipeline

## Status

Accepted

## Context

Capture Studio records media in the browser using `getUserMedia`, `getDisplayMedia`, and `MediaRecorder`—not WebRTC peer connections. Screen + webcam mode composites frames on a canvas before encoding.

## Decision

### Capture flow

1. **Acquire streams** via `useStream` (mic, camera, screen).
2. **Composite** (when needed) with `requestVideoFrameCallback` + canvas at 30 FPS. Screen + webcam overlay uses normalized drag placement (`WebcamOverlayPlacement`) shared between preview PIP and canvas compositor—not fixed corners.
3. **Prime canvas** via `canvasPrimeGate` before `MediaRecorder.start()` to avoid blank first frames.
4. **Encode** with browser-selected MIME types from `getMimeDictionary()` (probed once per page load).
5. **Finalize** chunks into a `Blob`, preview with object URLs, optional session persistence via `RecordingContext`.

### MIME selection

Probe `MediaRecorder.isTypeSupported` once, rank by codec preference (MP4/H.264 where available, else WebM/VP8+Opus).

### Lifecycle

- Stream ready triggers countdown nudges or auto-start (non-countdown modes).
- Stop requests final `requestData()`, finalizes blob, then stops tracks.
- Generation tokens invalidate stale `MediaRecorder` event handlers after restart.
- Screen share `ended` event auto-stops recording when user ends share via browser UI.

## Consequences

- Canvas compositing adds CPU cost but enables webcam overlay on screen recordings.
- MIME and codec support vary by browser; fallback recorder construction without explicit mime is required.
- No upload pipeline—blobs remain client-side until download or session clear.
- Long recordings spill chunks to IndexedDB (see ADR 002).
