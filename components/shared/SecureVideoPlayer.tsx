"use client";

import React, { useState } from "react";

type Props = {
  src: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function SecureVideoPlayer({ src, className, style }: Props) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {error && (
        <p style={{ margin: "0 0 8px", fontSize: 11, color: "#f88", lineHeight: 1.45 }}>
          {error}
        </p>
      )}
      <video
        key={src}
        src={src}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        className={className}
        style={{
          width: "100%",
          maxHeight: 320,
          borderRadius: 8,
          background: "#000",
          display: "block",
          ...style,
        }}
        onContextMenu={(e) => e.preventDefault()}
        onError={() => {
          setError("Não foi possível reproduzir o vídeo. Tente recarregar a página.");
        }}
        onLoadedData={() => setError(null)}
      />
    </div>
  );
}
