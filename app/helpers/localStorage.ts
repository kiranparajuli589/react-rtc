/**
 * Thin, SSR-safe wrappers around the Web Storage API.
 */

import isServer from "./isServer"

export const setLocalStorage = (key: string, value: unknown): void => {
  if (!isServer()) {
    if (!key) {
      throw new Error("Key is required!")
    } else if (typeof value === "object") {
      localStorage.setItem(key, JSON.stringify(value))
    } else {
      localStorage.setItem(key, String(value))
    }
  }
}

export const getLocalStorage = <T = unknown>(
  key: string
): T | string | null | undefined => {
  if (!isServer()) {
    const itemString = localStorage.getItem(key)
    if (!itemString) {
      return null
    }
    try {
      return JSON.parse(itemString) as T
    } catch {
      return itemString
    }
  }
  return undefined
}

export const clearLocalStorage = (key: string | null = null): void => {
  if (!isServer()) {
    if (!key) {
      localStorage.clear()
    } else {
      localStorage.removeItem(key)
    }
  }
}
