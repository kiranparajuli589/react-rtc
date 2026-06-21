import type { CSSProperties, MouseEventHandler } from "react";
import type { LucideIcon } from "lucide-react";

type IconProps = {
  icon: LucideIcon;
  size?: number;
  color?: string;
  className?: string;
  strokeWidth?: number;
  fill?: string;
  title?: string;
  onClick?: MouseEventHandler<SVGSVGElement>;
  style?: CSSProperties;
};

export default function Icon({
  icon: IconComponent,
  size = 24,
  color = "currentColor",
  className = "",
  strokeWidth = 2,
  fill,
  title,
  onClick,
  style,
}: IconProps) {
  return (
    <IconComponent
      size={size}
      color={color}
      className={`select-none shrink-0 ${className}`}
      strokeWidth={strokeWidth}
      fill={fill}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      onClick={onClick}
      style={style}
    />
  );
}
