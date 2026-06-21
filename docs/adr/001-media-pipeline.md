# ADR 001: Media capture pipeline

## Status

Accepted

## Context

Capture Studio records media in the browser using `getUserMedia`, `getDisplayMedia`, and `MediaRecorder`—not WebRTC peer connections. Screen + webcam mode composites frames on a canvas before encoding.

## Decision

### Capture flow

1. **Acquire streams** via `useStream` (mic, camera, screen).
2. **Composite** (screen + camera) on a canvas at 30 FPS. The draw loop uses `requestAnimationFrame` with `shouldDrawThisFrame`—not the screen video's `requestVideoFrameCallback`—because `getDisplayMedia` throttles when the display is static, which would make the webcam overlay choppy. Camera-only mode may use `requestVideoFrameCallback` when available (`videoFrameHelper`).
3. **Overlay placement:** normalized `WebcamOverlayPlacement` (`centerX`, `centerY`, `size`) shared between `DraggableWebcamPip` (live preview) and `screenWebcamCompositor` (encoded frames). A separate offscreen webcam video element feeds the compositor so preview drag stays smooth during recording.
4. **Prime canvas** via `canvasPrimeGate` before `MediaRecorder.start()` to avoid blank first frames.
5. **Encode** with browser-selected MIME types from `getMimeDictionary()` (probed once per page load).
6. **Finalize** chunks into a `Blob`, preview with object URLs, optional session persistence via `RecordingContext`.

### MIME selection

Probe `MediaRecorder.isTypeSupported` once, rank by codec preference (MP4/H.264 where available, else WebM/VP8+Opus).

### Lifecycle

- Stream ready triggers countdown nudges or auto-start (non-countdown modes).
- Stop requests final `requestData()`, finalizes blob, then stops tracks.
- Generation tokens invalidate stale `MediaRecorder` event handlers after restart.
- Screen share `ended` event auto-stops recording when user ends share via browser UI.
- **Restart from preview:** toolbar confirms once; screen modes force a new `getDisplayMedia` pick before countdown resumes.

## Consequences

- Canvas compositing adds CPU cost but enables webcam overlay on screen recordings.
- MIME and codec support vary by browser; fallback recorder construction without explicit mime is required.
- No upload pipeline—blobs remain client-side until download, session clear, or your own API integration.
- Long recordings spill chunks to IndexedDB (see ADR 002).
