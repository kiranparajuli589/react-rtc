import { renderHook } from "@testing-library/react";
import { useCallback, useEffect, useState } from "react";
import { describe, expect, it } from "vitest";

describe("camera preview flicker root cause", () => {
  it("unstable inline callback gets a new identity every render", () => {
    const identities: unknown[] = [];

    const { rerender } = renderHook(() => {
      const initCamStream = () => {};
      identities.push(initCamStream);
      return initCamStream;
    });

    rerender();
    rerender();

    expect(identities.length).toBeGreaterThan(1);
    expect(identities[0]).not.toBe(identities[1]);
    expect(identities[1]).not.toBe(identities[2]);
  });

  it("stable initCamStream via useCallback does not retrigger effect on rerender", () => {
    let effectRuns = 0;

    const { rerender } = renderHook(() => {
      const [, setCameraStream] = useState<object | null>(null);
      const initCamStream = useCallback(() => {
        effectRuns++;
        setCameraStream({ id: effectRuns });
      }, []);
      useEffect(() => {
        initCamStream();
      }, [initCamStream]);
    });

    rerender();
    rerender();

    expect(effectRuns).toBe(1);
  });
});
