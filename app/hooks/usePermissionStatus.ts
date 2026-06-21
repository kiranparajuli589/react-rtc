import { useEffect, useState } from "react"

import ConsoleLogger from "@/helpers/consoleLogger"

const getPermissionsApiAvailability = (): boolean | null => {
  if (typeof navigator === "undefined") {
    return null
  }

  return !!navigator.permissions
}

export const usePermissionStatus = (permissionName: string, enabled = true) => {
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionState | null>(null)
  const [isPermissionAPIAvailable, setIsPermissionAPIAvailable] = useState<
    boolean | null
  >(() => getPermissionsApiAvailability())

  useEffect(() => {
    if (!enabled || !navigator.permissions) {
      return
    }

    let status: PermissionStatus | undefined

    const handleChange = () => {
      if (status) {
        setPermissionStatus(status.state)
      }
    }

    navigator.permissions
      .query({ name: permissionName as PermissionName })
      .then((result) => {
        ConsoleLogger.info("Query API available for permissions.")
        setIsPermissionAPIAvailable(true)
        status = result
        setPermissionStatus(result.state)
        result.addEventListener("change", handleChange)
      })
      .catch(() => {
        setPermissionStatus(null)
        setIsPermissionAPIAvailable(false)
        ConsoleLogger.warn("Error getting permission status using query API.")
      })

    return () => {
      if (status) {
        status.removeEventListener("change", handleChange)
      }
    }
  }, [permissionName, enabled])

  if (!enabled) {
    return { permissionStatus: null, isPermissionAPIAvailable: null }
  }

  return { permissionStatus, isPermissionAPIAvailable }
}
