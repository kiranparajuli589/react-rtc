import { describe, expect, it } from "vitest";

import { DEFAULT_WEBCAM_OVERLAY, getWebcamSizeFraction } from "@/constants/recording";
import {
  clampWebcamOverlayCenter,
  computeCompositorLayout,
  computeWebcamOverlayRect,
} from "@/helpers/screenWebcamCompositor";

describe("screenWebcamCompositor", () => {
  it("places webcam in bottom-right by default", () => {
    const layout = computeCompositorLayout(1920, 1080, DEFAULT_WEBCAM_OVERLAY);
    expect(layout.canvasWidth).toBe(1920);
    expect(layout.canvasHeight).toBe(1080);
    expect(layout.x + layout.webcamWidth / 2).toBeGreaterThan(layout.canvasWidth / 2);
    expect(layout.y + layout.webcamHeight / 2).toBeGreaterThan(layout.canvasHeight / 2);
  });

  it("uses size fraction for overlay diameter", () => {
    const layout = computeCompositorLayout(1920, 1080, { centerX: 0.5, centerY: 0.5, size: "md" });
    expect(layout.webcamWidth).toBeCloseTo(1080 * getWebcamSizeFraction("md"));
    expect(layout.webcamHeight).toBe(layout.webcamWidth);
  });

  it("clamps center so circle stays inside bounds", () => {
    const clamped = clampWebcamOverlayCenter(0, 0, "xl", 1920, 1080);
    const rect = computeWebcamOverlayRect(
      { centerX: clamped.centerX, centerY: clamped.centerY, size: "xl" },
      1920,
      1080,
    );
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(1920);
    expect(rect.y + rect.height).toBeLessThanOrEqual(1080);
  });
});
