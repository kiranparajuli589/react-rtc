export type ContentRect = {
  x: number
  y: number
  width: number
  height: number
}

/** Letterboxed rect for media drawn with object-fit: contain inside a container. */
export function getObjectContainRect(
  containerWidth: number,
  containerHeight: number,
  mediaWidth: number,
  mediaHeight: number
): ContentRect {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    mediaWidth <= 0 ||
    mediaHeight <= 0
  ) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight }
  }

  const containerAspect = containerWidth / containerHeight
  const mediaAspect = mediaWidth / mediaHeight

  if (mediaAspect > containerAspect) {
    const width = containerWidth
    const height = width / mediaAspect
    return { x: 0, y: (containerHeight - height) / 2, width, height }
  }

  const height = containerHeight
  const width = height * mediaAspect
  return { x: (containerWidth - width) / 2, y: 0, width, height }
}
