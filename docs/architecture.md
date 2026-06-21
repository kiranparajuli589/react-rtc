# Architecture

Capture Studio is a client-only Next.js app. All recording happens in the browser.

## Layer diagram

```mermaid
flowchart TB
  subgraph ui [UI Layer]
    Menu[RecorderMenu]
    Panel[RecorderModePanel]
    Shell[RecorderShell]
    Toolbar[RecorderToolbar]
  end

  subgraph modes [Mode Hooks]
    Video[useVideoRecorder]
    Audio[useAudioRecorder]
    Screen[useScreenOnlyRecorder]
    ScreenCam[useScreenWithCamRecorder]
  end

  subgraph core [Recording Core]
    MR[useMediaRecorder]
    Stream[useStream]
    Chunks[useRecorderChunks]
    ChunkStore[recordingChunkStore IndexedDB]
  end

  subgraph helpers [Pure Helpers]
    Build[buildRecordStream]
    MIME[mimeTypeHelper]
    Prime[canvasPrimeGate]
    Compositor[screenWebcamCompositor]
    Dedup[screenCaptureDedup]
  end

  Menu --> Panel
  Panel --> modes
  modes --> MR
  modes --> Stream
  MR --> Chunks
  Chunks --> ChunkStore
  MR --> Build
  MR --> MIME
  MR --> Prime
  ScreenCam --> Compositor
  Stream --> Dedup
```

## Hook responsibilities

| Hook / module | Role |
|---------------|------|
| `useStream` | Acquire and attach mic, camera, screen streams |
| `useMediaRecorder` | Orchestrate recorder lifecycle, countdown, notifications |
| `useRecorderSetup` | Create `MediaRecorder`, wire `ondataavailable` / `onstop` |
| `useRecorderControls` | Start, stop, pause, resume, download |
| `useRecorderChunks` | Chunk accumulation + IDB spillover |
| `useScreenTrackMonitor` | Handle browser screen-share stop |
| `buildRecordStream` | Build `MediaStream` for encoder (canvas + tracks) |

## Module singletons

These are intentional—see [browser-quirks.md](browser-quirks.md):

- `canvasPrimeGate` — coordinate canvas warmup across async recorder start
- `screenCaptureDedup` — dedupe concurrent `getDisplayMedia` (React Strict Mode)
- `mimeTypeHelper` cache — probe `isTypeSupported` once per page load

## Data flow

1. User picks mode → mode hook initializes streams.
2. Streams merged into `mediaStream` → `setupRecorder` creates `MediaRecorder`.
3. User starts (or countdown completes) → `beginRecordingSession` primes canvas if needed, calls `recorder.start(timeslice)`.
4. Chunks append to memory; spill to IDB over threshold.
5. Stop → `requestData`, `onstop` → finalize blob → preview via object URL.
