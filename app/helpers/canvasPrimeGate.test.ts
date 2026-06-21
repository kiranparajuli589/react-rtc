import { afterEach, describe, expect, it, vi } from "vitest";

import { clearCanvasPrimedGate, notifyCanvasPrimed, resetCanvasPrimedGate, waitForCanvasPrimed } from "@/helpers/canvasPrimeGate";

describe("canvasPrimeGate", () => {
  afterEach(() => {
    clearCanvasPrimedGate();
  });

  it("resolves when canvas is primed", async () => {
    resetCanvasPrimedGate();
    const promise = waitForCanvasPrimed(1000);
    notifyCanvasPrimed();
    await expect(promise).resolves.toBe(true);
  });

  it("times out without blocking forever", async () => {
    resetCanvasPrimedGate();
    vi.useFakeTimers();
    const promise = waitForCanvasPrimed(50);
    vi.advanceTimersByTime(60);
    await expect(promise).resolves.toBe(false);
    vi.useRealTimers();
  });
});
