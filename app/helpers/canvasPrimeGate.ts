/**
 * Coordinates canvas warmup before MediaRecorder.start() — avoids encoding blank 300×150 frames.
 * Module singleton — see docs/browser-quirks.md.
 */

let primedResolve: (() => void) | null = null
let primedPromise: Promise<void> | null = null
let isPrimed = false

export function resetCanvasPrimedGate(): void {
  isPrimed = false
  primedPromise = new Promise<void>((resolve) => {
    primedResolve = () => {
      if (isPrimed) return
      isPrimed = true
      resolve()
    }
  })
}

export function notifyCanvasPrimed(): void {
  primedResolve?.()
}

/** Returns true when canvas primed in time; false on timeout. */
export async function waitForCanvasPrimed(timeoutMs = 5000): Promise<boolean> {
  if (isPrimed) return true
  if (!primedPromise) return true

  try {
    await Promise.race([
      primedPromise,
      new Promise<void>((_, reject) => {
        window.setTimeout(
          () => reject(new Error("Canvas prime timeout")),
          timeoutMs
        )
      }),
    ])
    return true
  } catch {
    return false
  }
}

export function clearCanvasPrimedGate(): void {
  isPrimed = false
  primedResolve = null
  primedPromise = null
}

/** Clears gate state (for tests). */
export function resetCanvasPrimedGateForTests(): void {
  clearCanvasPrimedGate()
}
