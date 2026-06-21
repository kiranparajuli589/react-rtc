import { describe, expect, it } from "vitest";

import { getObjectContainRect } from "@/helpers/objectContainRect";

describe("getObjectContainRect", () => {
  it("letterboxes wide media in a tall container", () => {
    const rect = getObjectContainRect(400, 300, 1920, 1080);
    expect(rect.width).toBe(400);
    expect(rect.height).toBeCloseTo(225);
    expect(rect.x).toBe(0);
    expect(rect.y).toBeCloseTo(37.5);
  });

  it("letterboxes tall media in a wide container", () => {
    const rect = getObjectContainRect(400, 300, 1080, 1920);
    expect(rect.height).toBe(300);
    expect(rect.width).toBeCloseTo(168.75);
    expect(rect.x).toBeCloseTo(115.625);
    expect(rect.y).toBe(0);
  });

  it("fills container when media matches aspect ratio", () => {
    const rect = getObjectContainRect(1600, 900, 1920, 1080);
    expect(rect).toEqual({ x: 0, y: 0, width: 1600, height: 900 });
  });
});
