import RecorderPreviewStage from "../previewStage";

type RecorderModeSkeletonProps = {
  variant?: "video" | "audio";
};

/** Placeholder while a recorder mode chunk loads — matches final layout dimensions. */
export default function RecorderModeSkeleton({ variant = "video" }: RecorderModeSkeletonProps) {
  return (
    <div className="recorder">
      <div className="recorder_menu__toolbar recorder_menu__toolbar--skeleton" aria-hidden="true">
        <div className="h-10 w-40 rounded-lg bg-muted animate-pulse" />
        <div className="h-10 w-28 rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="recorder__preview_wrapper">
        <RecorderPreviewStage variant={variant} isStreamReady={false}>
          <div className="h-full w-full" />
        </RecorderPreviewStage>
      </div>
    </div>
  );
}
