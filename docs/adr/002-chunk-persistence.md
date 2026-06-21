# ADR 002: Chunk persistence

## Status

Accepted

## Context

`MediaRecorder` emits chunks into memory. Long recordings (up to 2 hours) can accumulate hundreds of megabytes and risk OOM on constrained devices.

## Decision

- Spill chunks to **IndexedDB** when in-memory total exceeds **32 MB** (`CHUNK_SPILL_THRESHOLD_BYTES` in `app/config.ts`).
- Each recording session gets a unique `sessionId`; spilled chunks are keyed by `(sessionId, index)`.
- On finalize, merge spilled + in-memory chunks into a single `Blob`.
- On `resetChunks` / `clearMediaRecorder`, delete the IDB session.

## Consequences

- IndexedDB is async; finalize waits for read before building blob.
- If IndexedDB is unavailable (private mode quirks), recording continues in-memory only.
- Object URLs from `useBlobObjectUrl` are revoked on unmount—preview does not leak memory.
