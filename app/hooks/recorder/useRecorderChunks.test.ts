import { describe, expect, it } from "vitest"

import useRecorderChunks from "@/hooks/recorder/useRecorderChunks"
import { RECORDING_TYPE } from "@/constants/recordingTypes"
import { renderHook, act } from "@testing-library/react"

describe("useRecorderChunks", () => {
  it("ignores chunks from stale generations", () => {
    const { result } = renderHook(() =>
      useRecorderChunks({
        type: RECORDING_TYPE.VIDEO,
        mimeInfo: { mimeType: "video/webm", fileExtension: "webm" },
      })
    )

    const gen1 = result.current.bumpGeneration()
    act(() => {
      result.current.appendChunk(gen1, new Blob(["a"], { type: "video/webm" }))
    })

    result.current.bumpGeneration()
    act(() => {
      result.current.appendChunk(gen1, new Blob(["b"], { type: "video/webm" }))
    })

    expect(result.current.recordedChunksRef.current).toHaveLength(1)
  })
})
