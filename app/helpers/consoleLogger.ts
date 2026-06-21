import Config from "@/config"

const ConsoleLogger = {
  info: (...args: unknown[]) => {
    if (Config.DEBUG) {
      console.log(...args)
    }
  },
  warn: (...args: unknown[]) => {
    if (Config.DEBUG) {
      console.warn(...args)
    }
  },
  error: (...args: unknown[]) => {
    console.error(...args)
  },
  log: (...args: unknown[]) => {
    if (Config.DEBUG) {
      console.log(...args)
    }
  },
  debug: (...args: unknown[]) => {
    if (Config.DEBUG) {
      console.debug(...args)
    }
  },
}

export default ConsoleLogger
