import React from "react";

/** Very subtle dark veil to make emissive shards pop a bit more. */
export const DarknessMask: React.FC = () => {
  return (
    <div
      style={{
        pointerEvents: "none",
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(0,0,0,0.15)",
      }}
    />
  );
};
