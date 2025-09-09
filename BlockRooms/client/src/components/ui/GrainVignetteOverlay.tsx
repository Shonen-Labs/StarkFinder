import React from "react";

/** Fullscreen grain + vignette for mood. Pure CSS, no logic. */
export const GrainVignetteOverlay: React.FC = () => {
  return (
    <div
      style={{
        pointerEvents: "none",
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)",
        mixBlendMode: "multiply",
      }}
    />
  );
};
