// Minimal next/image shim — renders a plain <img>.
import * as React from "react";

export interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | { src: string };
  alt?: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
  fill?: boolean;
  loader?: any;
  placeholder?: string;
  blurDataURL?: string;
  quality?: number;
  unoptimized?: boolean;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(function NextImageShim(
  { src, alt = "", priority: _priority, fill, loader: _loader, placeholder: _placeholder, blurDataURL: _blurDataURL, quality: _quality, unoptimized: _unoptimized, style, ...rest },
  ref
) {
  const resolved = typeof src === "string" ? src : src?.src;
  const fillStyle: React.CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
    : undefined;
  return <img ref={ref} src={resolved} alt={alt} style={{ ...(fillStyle ?? {}), ...(style ?? {}) }} {...rest} />;
});

export default Image;
