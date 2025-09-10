import { useRef, useEffect, useState } from "react";

export function AudioManager(): null {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  useEffect(() => {
    // Create background music audio element
    const audio = new Audio("/bgmusicd.mp3");
    audio.loop = true;
    audio.volume = 0.3; // Set to moderate volume since no entity distance scaling
    audioRef.current = audio;

    // Try to play background music immediately (will fail without user interaction)
    const tryAutoPlay = async (): Promise<void> => {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.log("Autoplay blocked, waiting for user interaction");
      }
    };

    tryAutoPlay();

    // Listen for any user interaction to enable audio
    const handleInteraction = async (): Promise<void> => {
      if (!hasInteracted) {
        setHasInteracted(true);
        try {
          await audio.play();
          setIsPlaying(true);
        } catch (error) {
          console.log("Failed to play audio:", error);
        }
      }
    };

    // Add event listeners for user interaction
    document.addEventListener("click", handleInteraction);
    document.addEventListener("keydown", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [hasInteracted]);

  // Audio manager runs silently with no UI
  return null;
}
