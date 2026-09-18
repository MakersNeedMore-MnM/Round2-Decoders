import Image from "next/image";
import { cn } from "@/lib/utils";

// Native asset dimensions — used to derive width from a given height so the
// logo is only ever scaled, never cropped or distorted.
const LOGO_WIDTH = 2172;
const LOGO_HEIGHT = 724;
const ASPECT_RATIO = LOGO_WIDTH / LOGO_HEIGHT;

interface LogoProps {
  /** Rendered height in px — width is derived from the asset's native aspect ratio. */
  height?: number;
  className?: string;
  priority?: boolean;
}


export function Logo({ height = 32, className, priority }: LogoProps) {
  const width = Math.round(height * ASPECT_RATIO);
  return (
    <Image
      src="/logo/prospectiq-logo.png"
      alt="ProspectIQ"
      width={width}
      height={height}
      priority={priority}
      className={cn("shrink-0 object-contain", className)}
      style={{ width, height }}
    />
  );
}
