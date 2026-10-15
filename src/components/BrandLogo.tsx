"use client";

import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

/** White wordmark for the dark clinical UI */
export function BrandLogo({
  className = "h-auto w-[180px] object-contain",
  width = 200,
  height = 74,
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/PATIENTCARE-lite.png"
      alt="Patient Care"
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
