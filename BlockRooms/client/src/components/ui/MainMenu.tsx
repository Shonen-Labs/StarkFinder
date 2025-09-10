import React, { useEffect, useMemo, useState } from "react";
import useAppStore, { GamePhase } from "../../zustand/store";
import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { useGameData } from "../../dojo/hooks/useGameData";
import { useInitializePlayer } from "../../dojo/hooks/useInitializePlayer";
import { useStartGame } from "../../dojo/hooks/useStartGame";

type Move = "up" | "down" | "left" | "right";

export function MainMenu(): JSX.Element {
  const { status, address, handleConnect, isConnecting } = useStarknetConnect();
  const { playerStats, isLoading: playerLoading, refetch } = useGameData();
  const {
    initializePlayer,
    isLoading: initializing,
    canInitialize,
  } = useInitializePlayer();
  const {
    startGame,
    isLoading: startingGame,
    canStartGame,
  } = useStartGame();
  const { setConnectionStatus, setLoading, gamePhase, player, startGame: startGameUI } =
    useAppStore();

  const isConnected = status === "connected";
  const hasPlayerStats = playerStats !== null;
  const isLoading = isConnecting || playerLoading || initializing || startingGame;

  const images = useMemo(
    () => ["/bk1.jpg", "/bk2.jpg", "/bk3.jpg", "/bk4.jpg", "/bk5.jpg", "/bk6.jpg"],
    []
  );
  const [bg, setBg] = useState(0);
  const [dir, setDir] = useState<Move>("up");

  useEffect(() => {
    setConnectionStatus(
      status === "connected" ? "connected" : isConnecting ? "connecting" : "disconnected"
    );
  }, [status, isConnecting, setConnectionStatus]);

  useEffect(() => setLoading(isLoading), [isLoading, setLoading]);

  // tiny ambient background swapper
  useEffect(() => {
    const t = setInterval(() => {
      setBg((b) => (b + 1) % images.length);
      setDir((d) => (d === "up" ? "down" : "up"));
    }, 5000);
    return () => clearInterval(t);
  }, [images.length]);

  const canEnterGame = isConnected && hasPlayerStats && !startingGame;
  const gameAlreadyActive = gamePhase === GamePhase.ACTIVE || (player as any)?.game_active;

  const handleWalletConnect = async (): Promise<void> => {
    await handleConnect();
    setTimeout(() => refetch(), 1500);
  };

  const handlePlayerInit = async (): Promise<void> => {
    const res = await initializePlayer();
    if (res?.success) setTimeout(() => refetch(), 2000);
  };

  const handleStartOrEnterGame = async (): Promise<void> => {
    if (gameAlreadyActive) {
      startGameUI();
      return;
    }
    if (!canStartGame) return;
    const res = await startGame();
    if (res?.success) startGameUI();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundImage: `url(${images[bg]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            width: 520,
            maxWidth: "92vw",
            border: "2px solid #444",
            borderRadius: 16,
            padding: 24,
            background: "rgba(0,0,0,0.6)",
            color: "white",
            fontFamily: "monospace",
            boxShadow: "0 12px 36px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ fontSize: 26, letterSpacing: 2, color: "#E1CF48" }}>
            BLOCKROOMS
          </div>
          <div style={{ opacity: 0.8, marginTop: 4 }}>
            {address ? `Wallet: ${address.slice(0, 6)}...${address.slice(-4)}` : "Wallet: —"}
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 22 }}>
            <button
              onClick={handleWalletConnect}
              disabled={isConnected || isConnecting}
              style={{
                padding: "12px 16px",
                border: "2px solid #555",
                borderRadius: 10,
                background: isConnected ? "#224422" : "#111",
                color: isConnected ? "#9AD8AA" : "white",
                cursor: isConnected ? "default" : "pointer",
              }}
            >
              1. {isConnected ? "CONNECTED" : "CONNECT WALLET"}
            </button>

            <button
              onClick={handlePlayerInit}
              disabled={!isConnected || !canInitialize || initializing}
              style={{
                padding: "12px 16px",
                border: "2px solid #555",
                borderRadius: 10,
                background: canInitialize ? "#111" : "#1a1a1a",
                color: "white",
                cursor: canInitialize ? "pointer" : "not-allowed",
              }}
            >
              2. INITIALIZE PLAYER
            </button>

            <button
              onClick={handleStartOrEnterGame}
              disabled={!isConnected || startingGame}
              style={{
                padding: "12px 16px",
                border: "2px solid #555",
                borderRadius: 10,
                background: "#111",
                color: "white",
                cursor: "pointer",
              }}
            >
              {startingGame
                ? "Starting Game..."
                : gameAlreadyActive
                ? "3. ENTER GAME"
                : canEnterGame
                ? "3. START GAME"
                : "3. START GAME (Initialize Player First)"}
            </button>

            {isLoading && (
              <div style={{ marginTop: 10, color: "#ccc", fontSize: 13 }}>
                🔄 Processing blockchain transaction...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;
