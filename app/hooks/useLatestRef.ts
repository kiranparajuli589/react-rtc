import { useLayoutEffect, useRef } from "react"

export default function useLatestRef<T>(value: T) {
  const ref = useRef(value)

  useLayoutEffect(() => {
    ref.current = value
  })

  return ref
}
