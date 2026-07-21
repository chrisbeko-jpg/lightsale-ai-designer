import Image from "next/image";
import { LIGHTSALE_LOGO_SRC } from "@/lib/brand/lightsale-logo";

interface LightsaleLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function LightsaleLogo({
  width = 140,
  height = 38,
  className = "",
}: LightsaleLogoProps) {
  return (
    <Image
      src={LIGHTSALE_LOGO_SRC}
      alt="Lightsale"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
