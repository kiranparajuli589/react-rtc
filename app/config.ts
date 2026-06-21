type AppConfig = {
  /** Base URL used when building absolute asset URLs (e.g. notification icons). */
  BASE_URL: string
  /** Enables verbose `ConsoleLogger` output. */
  DEBUG: boolean
  /** Hard cap for a single recording, in seconds. */
  RECORD_TIME_LIMIT_IN_SEC: number
  /** In-memory chunk total before spilling to IndexedDB. */
  CHUNK_SPILL_THRESHOLD_BYTES: number
}

const Config: AppConfig = {
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "",
  DEBUG: process.env.NEXT_PUBLIC_DEBUG === "true",
  RECORD_TIME_LIMIT_IN_SEC:
    Number(process.env.NEXT_PUBLIC_RECORD_TIME_LIMIT_IN_SEC) || 2 * 60 * 60,
  CHUNK_SPILL_THRESHOLD_BYTES: 32 * 1024 * 1024,
}

export default Config
