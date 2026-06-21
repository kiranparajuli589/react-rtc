import { RECORDING_TYPE, type RecordingType } from "@/constants/recordingTypes"
import type { MimeTypeInfo } from "@/types/recording"

export function getAllSupportedMimeTypes(...mediaTypes: string[]): string[] {
  if (!mediaTypes.length) mediaTypes.push("video", "audio")

  const CONTAINERS = ["mp4", "webm", "mp3", "aac", "not-supported"]
  const CODECS = [
    "vp9",
    "vp8",
    "opus",
    "vorbis",
    "aac",
    "mp4a",
    "not-supported",
  ]

  const supportedTypes: string[] = []

  for (const ext of CONTAINERS) {
    for (const mediaType of mediaTypes) {
      const typeWithoutCodec = `${mediaType}/${ext}`
      if (MediaRecorder.isTypeSupported(typeWithoutCodec)) {
        supportedTypes.push(typeWithoutCodec)
      }

      for (const codec1 of CODECS) {
        const typeWithCodec1 = `${typeWithoutCodec};codecs=${codec1}`
        if (MediaRecorder.isTypeSupported(typeWithCodec1)) {
          supportedTypes.push(typeWithCodec1)
        }

        for (const codec2 of CODECS) {
          if (codec1 !== codec2) {
            const typeWithCodecs = `${typeWithoutCodec};codecs="${codec1}, ${codec2}"`
            if (MediaRecorder.isTypeSupported(typeWithCodecs)) {
              supportedTypes.push(typeWithCodecs)
            }
          }
        }
      }
    }
  }

  return supportedTypes
}

// Sort the MIME types based on quality (most preferred first)
const qualityMap: Record<string, number> = {
  "video/mp4;codecs=mp4a": 5,
  'video/webm;codecs="vp8, opus"': 4,
  "video/webm;codecs=vp8": 3,
  "video/mp4": 2,
  "video/webm": 1,
  "audio/mp4;codecs=mp4a": 5,
  "audio/webm;codecs=opus": 4,
  "audio/webm;codecs=vorbis": 3,
  "audio/mp4": 2,
  "audio/webm": 1,
}

export function extensionFromMimeType(mime: string | null): string {
  return (mime ?? "").split(";")[0].split("/")[1]?.trim() ?? ""
}

export function getMostSuitableMimeType(
  supportedMimeTypes: string[],
  type: string
): string | null {
  const filteredMimeTypes = supportedMimeTypes.filter((mimeType) =>
    mimeType.startsWith(type + "/")
  )

  if (filteredMimeTypes.length === 0) {
    return null
  }

  const sortedMimeTypes = filteredMimeTypes.sort((a, b) => {
    const qualityA = qualityMap[a] || 0
    const qualityB = qualityMap[b] || 0
    return qualityB - qualityA
  })

  return sortedMimeTypes[0]
}

let cachedMimeDictionary: Record<RecordingType, MimeTypeInfo> | null = null

function buildMimeDictionary(): Record<RecordingType, MimeTypeInfo> {
  const supportedMimeTypes = getAllSupportedMimeTypes()
  const audioMimeType = getMostSuitableMimeType(supportedMimeTypes, "audio")
  const videoMimeType = getMostSuitableMimeType(supportedMimeTypes, "video")

  const audioExtension = extensionFromMimeType(audioMimeType)
  const videoExtension = extensionFromMimeType(videoMimeType)

  const videoOptions: MimeTypeInfo = {
    mimeType: videoMimeType,
    fileExtension: videoExtension,
  }

  return {
    [RECORDING_TYPE.AUDIO]: {
      mimeType: audioMimeType,
      fileExtension: audioExtension,
    },
    [RECORDING_TYPE.VIDEO]: videoOptions,
    [RECORDING_TYPE.SCREEN]: videoOptions,
    [RECORDING_TYPE.SCREEN_VIDEO]: videoOptions,
  }
}

/** Returns a lazily computed, module-cached MIME dictionary (probed once per page load). */
export function getMimeDictionary(): Record<RecordingType, MimeTypeInfo> {
  if (!cachedMimeDictionary) {
    cachedMimeDictionary = buildMimeDictionary()
  }
  return cachedMimeDictionary
}

/** Clears the cached dictionary (for tests). */
export function resetMimeDictionaryCache(): void {
  cachedMimeDictionary = null
}
