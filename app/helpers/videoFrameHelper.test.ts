import { describe, expect, it, vi } from "vitest"

import { shouldDrawThisFrame } from "@/helpers/videoFrameHelper"

describe("videoFrameHelper", () => {
  it("throttles frames to target fps", () => {
    vi.spyOn(performance, "now").mockReturnValue(1000)
    expect(shouldDrawThisFrame(970, 30)).toBe(false)
    expect(shouldDrawThisFrame(966, 30)).toBe(true)
  })
})
