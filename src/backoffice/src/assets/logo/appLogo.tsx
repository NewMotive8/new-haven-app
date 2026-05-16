"use client";

import React from "react";
import Image from "next/image";

export default function AppLogo(
  props: React.SVGProps<SVGSVGElement> & {
    width?: number;
    height?: number;
    color?: string;
  },
) {
  const { width = 200, height = 60, color, ...svgProps } = props;

  // Change this path to your custom logo
  // Supported formats: .svg, .png, .jpg
  // Place your logo file in: public/images/logo/your-logo.png
  const logoPath = "/images/logo/full-logo.png";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "1rem",
      }}
    >
      <Image
        src={logoPath}
        alt="Logo"
        width={width}
        height={height}
        style={{
          maxWidth: "100%",
          height: "auto",
          objectFit: "contain",
          filter: color === "navbar-text-color" ? "invert(1)" : "none",
        }}
        priority
      />
    </div>
  );
}
