# Browser quirks

Practical notes for maintaining Capture Studio across browsers.

## React Strict Mode double-mount

`getDisplayMedia` must not be called twice concurrently. `screenCaptureDedup.ts` holds a module-level promise so the second mount reuses the in-flight capture.

## Canvas prime gate

Default canvas size is 300×150. Starting `MediaRecorder` before the first real frame produces a black lead-in. `canvasPrimeGate` blocks `recorder.start()` until the compositor signals `notifyCanvasPrimed()`, with a 5s timeout and user toast.

## Screen track `ended`

When the user clicks "Stop sharing" in the browser chrome, the screen video track fires `ended`. `useScreenTrackMonitor` calls `recorderStop()` and shows a localized toast.

## MIME / codec variance

Safari prefers MP4; Chrome/Firefox prefer WebM. `getMimeDictionary()` probes once and ranks by quality map. Fallback: construct `MediaRecorder` without explicit `mimeType`.

## Safari pause / resume

`MediaRecorder.pause()` / `resume()` support varies. UI exposes pause; if unsupported, browser may no-op—acceptable degradation.

## AudioContext

Recording passes audio tracks directly to `MediaRecorder` (no `AudioContext` routing). `AudioContext` is used only by the audio visualizer.

## IndexedDB

Chunk spillover uses IndexedDB. Some private browsing modes restrict IDB; recording falls back to in-memory chunks only.

## Device labels before permission

`enumerateDevices` returns empty labels until `getUserMedia` grants access. `useRecordingDevices` prompts once, then re-enumerates.

## Object URL cleanup

`useBlobObjectUrl` revokes URLs on blob change and unmount—required for long sessions with multiple previews.
