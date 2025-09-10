import React, { useEffect, useState } from "react";

/**
 * Cosmetic “flashlight” radial gradient that follows the cursor.
 * UI-only: no raycasting or gameplay impact.
 */
export const Flashlight: React.FC = () => {
  const [pos, setPos] = useState({ x: -9999, y: -9999 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const size = 240;

  return (
    <div
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: 1300,
        width: size,
        height: size,
        borderRadius: size,
        left: pos.x - size / 2,
        top: pos.y - size / 2,
        background:
          "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 40%, rgba(0,0,0,0) 70%)",
        mixBlendMode: "screen",
      }}
    />
  );
};
