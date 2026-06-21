import { describe, expect, it, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"

vi.mock("@/config", () => ({
  default: {
    RECORD_TIME_LIMIT_IN_SEC: 3,
    DEBUG: false,
    BASE_URL: "",
  },
}))

import useRecordingTimer from "@/hooks/recorder/useRecordingTimer"

describe("useRecordingTimer", () => {
  it("calls onLimitReached when timer hits limit", () => {
    vi.useFakeTimers()
    const onLimitReached = vi.fn()

    renderHook(() =>
      useRecordingTimer({
        isRecording: true,
        isPaused: false,
        onLimitReached,
      })
    )

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(onLimitReached).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
