import type { CSSProperties, ReactNode } from "react";

type SkeletonBoxProps = {
  width?: CSSProperties["width"];
  maxHeight?: CSSProperties["maxHeight"];
  minHeight?: CSSProperties["minHeight"];
  maxWidth?: CSSProperties["maxWidth"];
  minWidth?: CSSProperties["minWidth"];
  height?: CSSProperties["height"];
  borderRadius?: CSSProperties["borderRadius"];
  backgroundColor?: CSSProperties["backgroundColor"];
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export default function SkeletonBox({
  width = "100%",
  maxHeight = undefined,
  minHeight = undefined,
  maxWidth = undefined,
  minWidth = undefined,
  height = "100%",
  borderRadius = "0px",
  backgroundColor = "#f5f5f5",
  children,
  className = "",
  style = {},
}: SkeletonBoxProps) {
  return (
    <div
      style={{
        height,
        maxHeight,
        minHeight,
        width,
        maxWidth,
        minWidth,
        borderRadius,
        backgroundColor,
        ...style,
      }}
      className={`animate-pulse ${className}`}
    >
      {children}
    </div>
  );
}
