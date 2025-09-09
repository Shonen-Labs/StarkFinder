import React, { useMemo } from "react";
import useAppStore from "../../zustand/store";

/**
 * Exact “BlockroomsCard” UI, wired to the same data the old HUD used.
 * Pure UI only — no gameplay logic changed.
 */
export const PlayerHUD: React.FC = () => {
  // same selectors as the old HUD
  const {
    player,
    gameStats,
    gamePhase,               // kept to mirror old HUD signature (unused visually)
    getActionsRemaining,
    position: playerPosition,
    currentRoom,
    connectionStatus,
  } = useAppStore();

  // keep the same early return as old HUD
  if (!player) return null;

  const actionsLeft = getActionsRemaining();
  const pad = (n: number) => Math.round(n || 0);

  // shortened id, identical to old HUD logic
  const playerShortId = useMemo(
    () => `${player.player_id.slice(0, 6)}...${player.player_id.slice(-4)}`,
    [player.player_id]
  );

  // avatar/feed image (UI only, won’t break pointer lock)
  const avatarSrc =
    (player as any)?.avatarUrl ??
    "https://cdn.discordapp.com/attachments/812390695864238201/1412607548393132125/image.png?ex=68b8e8cc&is=68b7974c&hm=cd8542dd52ec2b262f27004f0b52e9212898a14daaaec96387ae5d2731a363ec&.jpg";

  // colors
  const C = {
    bgShell: "#0b1216",
    border: "#293941",
    text: "#d0e5ee",
    dim: "#9eb3bb",
    headerBg: "#0d1519",
    ribbonBg: "#162129",
    gold: "#E1CF48",
    ok: "#90EE90",
    warn: "#ffaa00",
    bad: "#ff6666",
    panelBg: "#070a0c",
    label: "#ccc",
    gridGreen: "#7DF17C",
  };

  const healthColor =
    gameStats.currentHealth > gameStats.maxHealth * 0.5
      ? C.ok
      : gameStats.currentHealth > gameStats.maxHealth * 0.25
      ? C.warn
      : C.bad;

  // match the old HUD’s “current room” behavior; fall back to player.current_room
  const currentRoomId =
    (currentRoom as any)?.room_id?.toString?.() ??
    (player as any)?.current_room?.toString?.() ??
    "-";

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: 20,
        zIndex: 1200,
        fontFamily: "'Joystix', monospace",
        color: C.text,
        pointerEvents: "none",
        transform: "scale(0.7)",
        transformOrigin: "top left",
      }}
    >
      <link href="https://fonts.cdnfonts.com/css/joystix" rel="stylesheet" />

      {/* Card shell */}
      <div
        style={{
          width: 300,
          background: C.bgShell,
          border: `3px solid ${C.border}`,
          boxShadow: "0 0 0 4px #222 inset",
          pointerEvents: "none",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderBottom: `3px solid ${C.border}`,
            background: C.headerBg,
            letterSpacing: 2,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 18 }}>BLOCKROOMS</div>

          {/* tiny battery/signal cluster */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: C.dim,
              fontSize: 7,
            }}
          >
            <span style={{ textTransform: "uppercase" }}>
              {connectionStatus === "connected" ? "" : ""}
            </span>
            <div
              style={{
                width: 36,
                height: 14,
                border: `2px solid ${C.dim}`,
                position: "relative",
                display: "flex",
                gap: 2,
                padding: 2,
              }}
            >
              <div style={{ flex: 1, background: C.dim }} />
              <div style={{ flex: 1, background: C.dim }} />
              <div
                style={{
                  flex: 1,
                  background:
                    connectionStatus === "connected" ? C.dim : "transparent",
                }}
              />
              {/* stub */}
              <div
                style={{
                  position: "absolute",
                  right: -6,
                  top: 3,
                  width: 4,
                  height: 6,
                  background: C.dim,
                }}
              />
            </div>
          </div>
        </div>

        {/* CONNECT ribbon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: C.ribbonBg,
            borderBottom: `3px solid ${C.border}`,
            fontSize: 16,
            letterSpacing: 2,
            color: connectionStatus === "connected" ? C.ok : C.warn,
          }}
        >
          <div>IDENTITY</div>
          <div
            style={{
              width: 22,
              height: 18,
              border: `3px solid ${C.dim}`,
              borderRadius: 4,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: 4,
                bottom: -6,
                width: 8,
                height: 6,
                borderLeft: `3px solid ${C.dim}`,
                borderBottom: `3px solid ${C.dim}`,
                transform: "skewX(-20deg)",
              }}
            />
          </div>
        </div>

        {/* --- FACE / FEED IMAGE --- */}
        <div
          style={{
            border: `3px solid ${C.border}`,
            background: "#0e1418",
            aspectRatio: "1 / 1",
            position: "relative",
            overflow: "hidden",
            marginBottom: 10,
            pointerEvents: "none",
          }}
        >
          <img
            src={avatarSrc}
            alt="Feed"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter:
                "grayscale(100%) contrast(140%) brightness(95%) sepia(22%) hue-rotate(160deg) saturate(120%)",
              imageRendering: "pixelated" as any,
              pointerEvents: "none",
              userSelect: "none",
            }}
            draggable={false}
          />
        </div>

        {/* Body — stacked panes (no clicks to preserve pointer lock) */}
        <div style={{ padding: 10, borderBottom: `3px solid ${C.border}` }}>
          {/* --- PLAYER STATUS --- */}
          <div
            style={{
              border: `3px solid ${C.border}`,
              background: "#0e1418",
              padding: 10,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 14,
                letterSpacing: 2,
                marginBottom: 8,
                color: C.gold,
              }}
            >
              PLAYER STATUS
            </div>

            {/* ID */}
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: C.label }}>ID: </span>
              <span style={{ color: C.ok }}>{playerShortId}</span>
            </div>

            {/* Health */}
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: C.label }}>Health: </span>
              <span style={{ color: healthColor }}>
                {gameStats.currentHealth}/{gameStats.maxHealth}
              </span>
              <div
                style={{
                  width: 120,
                  height: 8,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: 4,
                  marginTop: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${
                      (gameStats.currentHealth /
                        Math.max(1, gameStats.maxHealth)) *
                      100
                    }%`,
                    height: "100%",
                    backgroundColor: healthColor,
                    transition: "width 0.25s ease",
                  }}
                />
              </div>
            </div>

            {/* Shards */}
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: C.label }}>Shards: </span>
              <span style={{ color: C.ok }}>{gameStats.currentShards}</span>
            </div>

            {/* Numbered shards */}
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: C.label }}>Special Shards: </span>
              <span style={{ color: C.gold }}>
                {player.has_shard_one ? "①" : "○"}{" "}
                {player.has_shard_two ? "②" : "○"}{" "}
                {player.has_shard_three ? "③" : "○"}
              </span>
              {gameStats.hasAllNumberedShards && (
                <span style={{ color: C.ok, marginLeft: 6 }}>✓ COMPLETE</span>
              )}
            </div>

            {/* Key */}
            <div style={{ marginBottom: 0 }}>
              <span style={{ color: C.label }}>Key: </span>
              <span style={{ color: gameStats.hasKey ? C.ok : C.bad }}>
                {gameStats.hasKey ? "YES" : "NO"}
              </span>
            </div>
          </div>

          {/* --- GAME PROGRESS --- */}
          <div
            style={{
              border: `3px solid ${C.border}`,
              background: "#0e1418",
              padding: 10,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 14,
                letterSpacing: 2,
                marginBottom: 8,
                color: C.gold,
              }}
            >
              GAME PROGRESS
            </div>

            <div style={{ marginBottom: 6 }}>
              <span style={{ color: C.label }}>Rooms Cleared: </span>
              <span style={{ color: C.ok }}>{gameStats.roomsCleared}</span>
            </div>

            <div style={{ marginBottom: 6 }}>
              <span style={{ color: C.label }}>Current Room: </span>
              <span style={{ color: C.ok }}>{currentRoomId}</span>
            </div>

            <div>
              <span style={{ color: C.label }}>Actions Left: </span>
              <span style={{ color: C.ok }}>{actionsLeft}</span>
            </div>
          </div>

          {/* --- GRID POSITION --- */}
          <div
            style={{
              border: `3px solid ${C.border}`,
              background: "#0e1418",
              padding: 10,
            }}
          >
            <div
              style={{
                fontSize: 14,
                letterSpacing: 2,
                marginBottom: 8,
                color: C.gold,
              }}
            >
              Grid Position:
            </div>

            <div style={{ marginBottom: 4 }}>
              <span style={{ color: C.gridGreen }}>X:</span>{" "}
              <span style={{ color: C.text }}>{pad(playerPosition.x)}</span>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: C.gridGreen }}>Y:</span>{" "}
              <span style={{ color: C.text }}>{pad(playerPosition.z)}</span>
            </div>
          </div>
        </div>

        {/* Footer strip (tiny) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "8px 10px",
            color: C.text,
            borderTop: `3px solid ${C.border}`,
            background: C.headerBg,
            letterSpacing: 2,
            fontSize: 11,
          }}
        >
          <span
            style={{
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: `10px solid ${C.text}`,
              transform: "translateY(2px)",
            }}
          />
          <span>PROPERTY OF KEPLER22BEE GAMING STUDIO</span>
          <span
            style={{
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: `10px solid ${C.text}`,
              transform: "translateY(2px)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerHUD;
