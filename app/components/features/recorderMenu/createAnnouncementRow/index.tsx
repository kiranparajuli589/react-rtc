"use client"

import { useState } from "react"

import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import Config from "@/config"
import type { RecordingType } from "@/constants/recordingTypes"
import { useRecording } from "@/contexts/recordingContext"
import { Button } from "@/components/ui/button"
import Icon from "@/designSystem/icon"
import ConsoleLogger from "@/helpers/consoleLogger"
import { getMimeDictionary } from "@/helpers/mimeTypeHelper"
import { getFileFromBlob } from "@/helpers/utils"
import type { CreateAnnouncementRowProps } from "@/types/recorder"

export default function CreateAnnouncementRow({
  isPlayerReady,
  recordBlob,
  recordTimer,
  type,
  queryType,
  className = "justify-end",
}: CreateAnnouncementRowProps) {
  const t = useTranslations("createAnnouncement")
  const { recordingData, setRecordingData } = useRecording()
  const [savedBlobKey, setSavedBlobKey] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const currentBlobKey = recordBlob
    ? `${recordBlob.size}:${recordBlob.type}`
    : null
  const saved =
    Boolean(recordingData?.blob) || savedBlobKey === currentBlobKey

  const saveToSession = (
    blob: Blob | null,
    timer: number,
    recordingType: RecordingType,
    recordingQueryType: RecordingType
  ) => {
    if (!blob) return
    setIsProcessing(true)
    try {
      const MimeDictionary = getMimeDictionary()
      const mimeType = MimeDictionary[recordingType]?.mimeType || blob.type
      const blobToUse = mimeType ? blob.slice(0, blob.size, mimeType) : blob
      const file = getFileFromBlob(
        blobToUse,
        recordingType,
        MimeDictionary[recordingType]
      )

      if (!recordingData?.blob) {
        setRecordingData({
          blob: blobToUse,
          type: recordingType,
          timer,
          mimeType: mimeType ?? undefined,
          file,
        })
      }

      if (Config.DEBUG) {
        console.groupCollapsed(
          "%c[Recorder] Keep recording (local session)",
          "color:#0a91d9;font-weight:700;"
        )
        console.log("type:", recordingType)
        console.log("queryType:", recordingQueryType)
        console.log("timerSec:", timer)
        console.log("blob:", blobToUse)
        console.log("file:", file)
        console.groupEnd()
      }

      setSavedBlobKey(currentBlobKey)
      toast.success(t("success"))
    } catch (err) {
      ConsoleLogger.error(err)
      toast.error(t("error"))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={`create-announcement ${className}`}>
      <Button
        type="button"
        className={`flex-centered gap-2 ${isProcessing ? "animate-pulse cursor-not-allowed" : ""}`}
        disabled={isProcessing || saved || !isPlayerReady}
        aria-label={t("ariaLabel")}
        onClick={() => saveToSession(recordBlob, recordTimer, type, queryType)}
      >
        {isProcessing && (
          <Icon
            icon={Loader2}
            color="#ffffff"
            className="animate-spin"
            size={26}
          />
        )}
        {saved ? t("saved") : t("keep")}
      </Button>
    </div>
  )
}
