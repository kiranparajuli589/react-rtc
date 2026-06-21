import { useCallback, useRef, useState } from "react";

import {
  appendChunkToStore,
  clearChunkSession,
  getChunkSpillThresholdBytes,
  readAllChunksFromStore,
} from "@/helpers/recordingChunkStore";

import type { RecordingType } from "@/constants/recordingTypes";
import type { MimeTypeInfo } from "@/types/recording";

type UseRecorderChunksArgs = {
  type: RecordingType;
  mimeInfo: MimeTypeInfo;
};

function createSessionId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function useRecorderChunks({ mimeInfo }: UseRecorderChunksArgs) {
  const [recordBlob, setRecordBlob] = useState<Blob | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const recordedChunksRef = useRef<Blob[]>([]);
  const activeRecorderGenerationRef = useRef(0);
  const lastBlobSizeRef = useRef(0);
  const sessionIdRef = useRef(createSessionId());
  const inMemoryBytesRef = useRef(0);
  const spilledChunkCountRef = useRef(0);

  const bumpGeneration = () => {
    activeRecorderGenerationRef.current += 1;
    return activeRecorderGenerationRef.current;
  };

  const isCurrentGeneration = (generation: number) => generation === activeRecorderGenerationRef.current;

  const appendChunk = useCallback((generation: number, data: Blob) => {
    if (!isCurrentGeneration(generation) || data.size <= 0) return;

    const threshold = getChunkSpillThresholdBytes();
    if (inMemoryBytesRef.current + data.size > threshold) {
      const index = spilledChunkCountRef.current;
      spilledChunkCountRef.current += 1;
      void appendChunkToStore(sessionIdRef.current, index, data);
      return;
    }

    inMemoryBytesRef.current += data.size;
    recordedChunksRef.current.push(data);
  }, []);

  const finalizeRecordBlob = useCallback(
    async (memoryChunks: Blob[]) => {
      const spilled = await readAllChunksFromStore(sessionIdRef.current);
      const chunks = [...spilled, ...memoryChunks];
      if (!chunks.length) return;

      const selectedMimeType = mimeInfo.mimeType;
      const blob = new Blob(chunks, { type: selectedMimeType ?? undefined });
      const nextBlob = blob.slice(0, blob.size, selectedMimeType ?? undefined);
      if (lastBlobSizeRef.current === nextBlob.size) return;
      lastBlobSizeRef.current = nextBlob.size;
      setRecordBlob(nextBlob);
      setIsFinalizing(false);
    },
    [mimeInfo.mimeType],
  );

  const resetChunks = useCallback(() => {
    const sessionId = sessionIdRef.current;
    recordedChunksRef.current = [];
    inMemoryBytesRef.current = 0;
    spilledChunkCountRef.current = 0;
    lastBlobSizeRef.current = 0;
    setRecordBlob(null);
    setIsFinalizing(false);
    sessionIdRef.current = createSessionId();
    void clearChunkSession(sessionId);
  }, []);

  const detachRecorderHandlers = (recorder: MediaRecorder | null | undefined) => {
    if (!recorder) return;
    recorder.ondataavailable = null;
    recorder.onstop = null;
  };

  return {
    recordBlob,
    setRecordBlob,
    isFinalizing,
    setIsFinalizing,
    recordedChunksRef,
    activeRecorderGenerationRef,
    bumpGeneration,
    isCurrentGeneration,
    appendChunk,
    finalizeRecordBlob,
    resetChunks,
    detachRecorderHandlers,
  };
}
