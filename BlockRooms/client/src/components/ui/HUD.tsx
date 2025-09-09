import React from "react";
import useAppStore from "../../zustand/store";

/**
 * Old HUD UI (unchanged look) but reads from the store instead of props.
 * - showGun      ← s.showGun
 * - ammoInMag    ← s.ammoInMag || s.currentAmmo || s.ammo || s.gunAmmo || s.gameStats?.*
 * - ammoReserve  ← s.ammoReserve || s.reserveAmmo || s.gunReserve || s.gameStats?.*
 *
 * No logic changes — pure UI.
 */
export const HUD: React.FC = () => {
  // Pull values from the store with resilient fallbacks (names differ between builds)
  const showGun = useAppStore((s: any) => !!s.showGun);

  const ammoInMag = useAppStore((s: any) =>
    (s.ammoInMag ??
      s.currentAmmo ??
      s.ammo ??
      s.gunAmmo ??
      s.gameStats?.ammoInMag ??
      s.gameStats?.currentAmmo ??
      s.gameStats?.ammo ??
      0) | 0
  );

  const ammoReserve = useAppStore((s: any) =>
    (s.ammoReserve ??
      s.reserveAmmo ??
      s.gunReserve ??
      s.gameStats?.ammoReserve ??
      s.gameStats?.reserveAmmo ??
      0) | 0
  );

  const pad3 = (n: number) => String(Math.max(0, n | 0)).padStart(3, "0");
  const bigAmmo = pad3(showGun ? ammoInMag : 0);
  const reserveAmmo = pad3(showGun ? ammoReserve : 0);

  return (
    <div
      style={{
        width: 260,
        top: 20,
        right: 20,
        height: 92,
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid #5c6770",
        boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
        fontFamily: "'Share Tech Mono', monospace",
        userSelect: "none",
        background: "linear-gradient(180deg, #AEB4BD 0%, #A7ACB5 100%)",
        position: "fixed",
        zIndex: 1200,
        pointerEvents: "none",
      }}
    >
      {/* Web font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap"
        rel="stylesheet"
      />

      {/* TOP STRIP */}
      <div
        style={{
          background: "#2a3944",
          height: 32,
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />

      {/* HEALTH BAR (visual only, kept from old HUD) */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 12,
          right: 12,
          height: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Plus icon */}
        <div
          style={{
            width: 18,
            height: 18,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div style={{ position: "relative", width: 14, height: 14 }}>
            <div
              style={{
                position: "absolute",
                left: 6,
                top: 0,
                width: 2,
                height: 14,
                background: "#ffffff",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 6,
                width: 14,
                height: 2,
                background: "#ffffff",
              }}
            />
          </div>
        </div>

        {/* Track */}
        <div
          style={{
            flex: 1,
            height: 16,
            background: "#0d0d0d",
            borderRadius: 2,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Orange dots + gray gap */}
          <div
            style={{
              position: "absolute",
              left: 6,
              top: 3,
              display: "flex",
              alignItems: "center",
              gap: 2,
              zIndex: 2,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  background: "#F47B00",
                }}
              />
            ))}
            <div
              style={{
                width: 6,
                height: 6,
                background: "#6f7b85",
              }}
            />
          </div>

          {/* Fill (kept as-is from old UI) */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "68%",
              background: "#F47B00",
            }}
          />
        </div>
      </div>

      {/* LOWER STRIP */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 60,
          display: "grid",
          gridTemplateColumns: "56px 84px 1fr",
          alignItems: "center",
        }}
      >
        {/* Left tab: thumb until gun is equipped */}
        <div
          style={{
            height: "100%",
            background: "#303b45",
            borderRight: "1px solid #1e272f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {showGun ? (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 26,
                    background: "#ffffff",
                    borderRadius: 2,
                  }}
                />
              ))}
            </div>
          ) : (
            <img
              src="https://media.discordapp.net/attachments/812390695864238201/1412774616304193546/image-removebg-preview_1.png?ex=68b98464&is=68b832e4&hm=dda1e4b293416b2f4612b2f53260b53a3dca5c5940294e8f70644f75b098779c&=&format=webp&quality=lossless"
              alt="thumb"
              style={{
                width: 128,
                height: 64,
                objectFit: "contain",
                pointerEvents: "none",
                userSelect: "none",
              }}
              draggable={false}
            />
          )}
        </div>

        {/* Center tab: gun icon only after pickup */}
        <div
          style={{
            height: "100%",
            borderRight: "1px solid #5c6770",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: 4,
          }}
        >
          {showGun && (
            <img
              src="https://cdn.discordapp.com/attachments/812390695864238201/1412575259873251328/dwdwd.png?ex=68b8caba&is=68b7793a&hm=e2fc00f44bee77ea48e8d268078a5d81604ad68b9fa7799ae11d3d5cbe19f71a&.png"
              alt="pistol"
              style={{
                width: 128,
                height: 64,
                objectFit: "contain",
                filter: "brightness(0)",
                pointerEvents: "none",
                userSelect: "none",
              }}
              draggable={false}
            />
          )}
        </div>

        {/* Ammo count */}
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            paddingLeft: 10,
            position: "relative",
          }}
        >
          <span
            style={{
              fontSize: 34,
              lineHeight: 1,
              color: "#0a0a0a",
              letterSpacing: 1,
              minWidth: 60,
              display: "inline-block",
              textAlign: "left",
            }}
          >
            {bigAmmo}
          </span>
          <span
            style={{
              position: "absolute",
              right: 10,
              bottom: 8,
              fontSize: 18,
              color: "#80868e",
            }}
          >
            {reserveAmmo}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HUD;
