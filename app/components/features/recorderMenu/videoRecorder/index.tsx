"use client";

import { useEffect, useRef } from "react";

import { toast } from "sonner";
import { useTranslations } from "next-intl";

import RecorderShell from "../recorderShell";
import RecorderToolbar from "../recorderToolbar";

import { RECORDING_TYPE } from "@/constants/recordingTypes";
import { useRecording } from "@/contexts/recordingContext";
import CreateAnnouncementRow from "@/features/recorderMenu/createAnnouncementRow";
import VideoPlayer from "@/core/mediaPlayer/VideoPlayer";
import useBlobObjectUrl from "@/hooks/useBlobObjectUrl";
import useVideoRecorder from "@/hooks/recorder/useVideoRecorder";
import type { VideoRecorderProps } from "@/types/recorder";

export default function VideoRecorder({
  muteAudio,
  selectedVideoDevice,
  selectedAudioDevice,
  setSelectedRecordingOption,
  recorderSettings,
  isMicDisabled,
  devicesList,
}: VideoRecorderProps) {
  const tPermissions = useTranslations("permissions");
  const tTitles = useTranslations("recorderTitles");
  const { recordingData } = useRecording();

  const {
    videoRef,
    canvasRef,
    recordBlob,
    recordTimer,
    formattedTimer,
    countdownRemaining,
    countDownStatus,
    isFinalizing,
    playerReady,
    setPlayerReady,
    onCancelRecordingInit,
    mediaRecorder,
    mediaStream,
    isRecording,
    isPaused,
    isStopped,
    recorderStart,
    recorderPause,
    recorderResume,
    recorderStop,
    downloadRecording,
    streamPermissionDenied,
    initCamStream,
    initAudioStream,
    setIsStopped,
    setRecordTimer,
    setRecordBlob,
  } = useVideoRecorder({
    recorderSettings,
    selectedAudioDevice,
    selectedVideoDevice,
    devicesList,
    isMicDisabled,
  });

  const previewObjectUrl = useBlobObjectUrl(recordBlob);

  useEffect(() => {
    if (streamPermissionDenied) {
      setSelectedRecordingOption(null);
      toast.error(tPermissions("cameraDenied"));
    }
  }, [streamPermissionDenied, setSelectedRecordingOption, tPermissions]);

  useEffect(() => {
    if (recordingData) {
      setIsStopped(true);
      setRecordBlob(recordingData.blob.slice(0, recordingData.blob.size, recordingData.mimeType));
      setRecordTimer(recordingData.timer);
    }
  }, [recordingData, setIsStopped, setRecordBlob, setRecordTimer]);

  useEffect(() => {
    document.title = isRecording
      ? tTitles("videoRecording", { time: formattedTimer })
      : tTitles("video");
  }, [formattedTimer, isRecording, tTitles]);

  useEffect(() => {
    if (!recordingData?.blob && selectedAudioDevice && !muteAudio && !isMicDisabled) {
      initAudioStream(selectedAudioDevice, recorderSettings.quality);
    }
  }, [selectedAudioDevice, muteAudio, isMicDisabled, recordingData?.blob, initAudioStream, recorderSettings.quality]);

  const initCamStreamRef = useRef(initCamStream);
  initCamStreamRef.current = initCamStream;

  useEffect(() => {
    if (!recordingData?.blob && selectedVideoDevice) {
      initCamStreamRef.current();
    }
  }, [selectedVideoDevice, recordingData?.blob]);

  return (
    <RecorderShell
      toolbar={
        <RecorderToolbar
          setSelectedRecordingOption={setSelectedRecordingOption}
          mediaRecorder={mediaRecorder}
          isRecording={isRecording}
          isPaused={isPaused}
          isStopped={isStopped}
          recorderStart={recorderStart}
          recorderPause={recorderPause}
          recorderResume={recorderResume}
          recorderStop={recorderStop}
          downloadRecording={downloadRecording}
          formattedTimer={formattedTimer}
          recordTimer={recordTimer}
          countDownStatus={countDownStatus}
          isStreamReady={Boolean(mediaStream)}
        />
      }
      countdownRemaining={countdownRemaining}
      countDownStatus={countDownStatus}
      onCancelRecordingInit={onCancelRecordingInit}
      isFinalizing={isFinalizing}
      isStopped={isStopped}
      recordBlob={recordBlob}
      isRecording={isRecording}
      isPlayerReady={playerReady}
      isStreamReady={Boolean(mediaStream)}
      previewVariant="video"
      previewContent={
        <>
          <CreateAnnouncementRow
            isPlayerReady={playerReady}
            recordBlob={recordBlob}
            recordTimer={recordTimer}
            type={RECORDING_TYPE.VIDEO}
            queryType={RECORDING_TYPE.VIDEO}
          />
          <VideoPlayer
            src={
              previewObjectUrl
                ? {
                    src: previewObjectUrl,
                    type: recordBlob?.type,
                  }
                : null
            }
            duration={recordTimer}
            onComponentReady={() => setPlayerReady(true)}
          />
        </>
      }
      livePreview={
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-contain"
            aria-hidden="true"
            style={{
              transform: `scaleX(${recorderSettings.mirror ? -1 : 1})`,
            }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden="true" />
        </>
      }
    />
  );
}
