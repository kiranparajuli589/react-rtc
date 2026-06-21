"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { RecordingData } from "@/types/recording";

type RecordingContextValue = {
  recordingData: RecordingData;
  setRecordingData: Dispatch<SetStateAction<RecordingData>>;
};

const RecordingContext = createContext<RecordingContextValue | null>(null);

export function RecordingProvider({
  children,
  initialRecordingData = null,
}: {
  children: ReactNode;
  initialRecordingData?: RecordingData;
}) {
  const [recordingData, setRecordingData] = useState<RecordingData>(initialRecordingData);

  const value = useMemo<RecordingContextValue>(() => ({ recordingData, setRecordingData }), [recordingData]);

  return <RecordingContext.Provider value={value}>{children}</RecordingContext.Provider>;
}

export function useRecording(): RecordingContextValue {
  const context = useContext(RecordingContext);

  if (context === null) {
    throw new Error("useRecording must be used within a RecordingProvider");
  }

  return context;
}
