import { useEffect, useRef } from "react";

type VideoSource = string | { src: string; type?: string } | null | undefined;

type VideoPlayerProps = {
  src: VideoSource;
  duration?: number;
  onComponentReady?: () => void;
};

export default function VideoPlayer({ src, onComponentReady = () => {} }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const readyForSrcRef = useRef<string | null>(null);

  const resolvedSrc = typeof src === "string" ? src : src?.src;
  const videoSrc = resolvedSrc ? resolvedSrc : undefined;

  useEffect(() => {
    readyForSrcRef.current = null;
  }, [videoSrc]);

  const handleReady = () => {
    if (!videoSrc || readyForSrcRef.current === videoSrc) {
      return;
    }
    readyForSrcRef.current = videoSrc;
    onComponentReady();
  };

  if (!videoSrc) {
    return null;
  }

  return (
    <video
      ref={ref}
      controls
      playsInline
      preload="auto"
      style={{ width: "100%", height: "100%", borderRadius: 8 }}
      src={videoSrc}
      onLoadedData={handleReady}
      onCanPlay={handleReady}
      aria-label="Recording preview"
    />
  );
}
