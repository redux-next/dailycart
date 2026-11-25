
"use client";

import Image from "next/image";
import { useState } from "react";

export default function LoadingImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
  objectFit = "cover",
}) {
  const [imageState, setImageState] = useState({
    source: src,
    isLoaded: false,
    hasError: false,
  });
  const validSource =
    typeof src === "string" && (src.startsWith("https://") || src.startsWith("/"));
  const isLoaded = imageState.source === src && imageState.isLoaded;
  const hasError = imageState.source === src && imageState.hasError;

  return (
    <>
      {validSource && !hasError && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={priority}
          loading={priority ? undefined : "lazy"}
          className={`loading-image ${isLoaded ? "is-loaded" : ""} ${className}`.trim()}
          style={{ objectFit }}
          onLoad={() =>
            setImageState({ source: src, isLoaded: true, hasError: false })
          }
          onError={() =>
            setImageState({ source: src, isLoaded: false, hasError: true })
          }
        />
      )}

      {(!validSource || hasError || !isLoaded) && (
        <span
          className={`image-loading-placeholder ${hasError ? "has-error" : ""}`}
          aria-hidden="true"
        >
          {!validSource || hasError ? (
            "Image unavailable"
          ) : (
            <span className="image-loading-shimmer" />
          )}
        </span>
      )}
    </>
  );
}
