import { describe, expect, it } from "vitest"

import { formatTime } from "@/core/mediaPlayer/utils"

describe("formatTime", () => {
  it("formats seconds under one minute", () => {
    expect(formatTime(0)).toBe("00:00")
    expect(formatTime(59)).toBe("00:59")
  })

  it("formats minutes and seconds", () => {
    expect(formatTime(65)).toBe("01:05")
    expect(formatTime(3599)).toBe("59:59")
  })

  it("formats hours", () => {
    expect(formatTime(3600)).toBe("01:00:00")
    expect(formatTime(7200)).toBe("02:00:00")
    expect(formatTime(3661)).toBe("01:01:01")
  })

  it("handles invalid values", () => {
    expect(formatTime(Number.NaN)).toBe("--:--")
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe("--:--")
  })
})
