import type { MimeTypeInfo } from "@/types/recording"

export const refIdGenerator = (): string => {
  let refId = ""

  for (let j = 0; j < 32; j++) {
    if (j === 8 || j === 12 || j === 16 || j === 20) {
      refId += "-"
    }
    refId += Math.floor(Math.random() * 16)
      .toString(16)
      .toUpperCase()
  }

  return refId
}

export const getFileFromBlob = (
  blob: Blob,
  type: string,
  mimeDict: MimeTypeInfo
): File =>
  new File(
    [blob],
    `${type}_REC_${refIdGenerator()}.${mimeDict.fileExtension}`,
    { type: mimeDict.mimeType ?? undefined }
  )
