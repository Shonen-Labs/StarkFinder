"use client";

import "./style.css";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { useRef, useEffect, useState } from "react";
import Homepage from "../pages/home/homepage";

gsap.registerPlugin(useGSAP, SplitText);

interface LoaderProps {
  children?: React.ReactNode;
}

const Loader: React.FC<LoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  const counterRef = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  //@ts-ignore
  const animationFrameRef = useRef<number>();

  const AnimateCounter = () => {
    const counterElement = counterRef.current;
    let current = 0;
    const updateInterval = 300;
    const maxDuration = 2000;
    const endValue = 100;
    const startTime = Date.now();

    const updateCounter = () => {
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < maxDuration) {
        current = Math.min(
          current + Math.floor(Math.random() * 30) + 5,
          endValue
        );
        //@ts-ignore
        counterElement.textContent = current;
        setTimeout(updateCounter, updateInterval);
      } else {
        //@ts-ignore
        counterElement.textContent = current;
        setTimeout(() => {
          gsap.to(counterElement, {
            y: -20,
            opacity: 0,
            duration: 0.3,
            ease: "power4.inOut",
          });
        }, -500);
      }
    };

    return updateCounter();
  };

  // Enhanced canvas rendering function with high-DPI support
  const renderVideoFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Enable high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (video.readyState >= 2) {
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    if (!video.paused && !video.ended) {
      animationFrameRef.current = requestAnimationFrame(renderVideoFrame);
    }
  };

  // Enhanced canvas setup with proper high-DPI handling
  const setupCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    // Get the device pixel ratio
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Get the display size
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // Set the canvas buffer size accounting for device pixel ratio
    canvas.width = displayWidth * devicePixelRatio;
    canvas.height = displayHeight * devicePixelRatio;

    // Get the drawing context and scale it
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(devicePixelRatio, devicePixelRatio);
      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }

    // Scale the canvas back down using CSS
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
  };

  // Initialize canvas dimensions and handle resize
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const handleLoadedMetadata = () => {
      setupCanvas();
    };

    const handleResize = () => {
      setupCanvas();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    window.addEventListener("resize", handleResize);

    // Initial setup
    if (video.readyState >= 1) {
      setupCanvas();
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useGSAP(
    () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      gsap.set(canvas, { opacity: 0 });
      video.pause();

      const tl = gsap.timeline({
        onStart: () => {
          AnimateCounter();
        },
      });

      tl.to(canvas, {
        opacity: 1,
        duration: 0.8,
        ease: "power3.in",
        delay: 2.2,
        onComplete: () => {
          // Start video playback (muted for autoplay compatibility)
          video.muted = true;
          video
            .play()
            .then(() => {
              renderVideoFrame();
            })
            .catch((error) => {
              console.log("Video play failed:", error);
              // Fallback: try to play without sound
              video.muted = true;
              video.play().then(() => {
                renderVideoFrame();
              });
            });
        },
      });

      const handleVideoEnd = () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        gsap.to(canvas, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          onComplete: () => {
            video.currentTime = 0;
            gsap.set(canvas, { opacity: 0 });
            gsap.set(containerRef.current, { opacity: 0 });
            setIsLoading(false);
          },
        });
      };

      video.addEventListener("ended", handleVideoEnd);

      return () => {
        video.removeEventListener("ended", handleVideoEnd);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    },
    { scope: containerRef }
  );

  return (
    <>
      {isLoading ? (
        <div ref={containerRef} className="loader-container">
          <div className="counter">
            <p ref={counterRef}>0</p>
          </div>
          <div className="loading-video">
            {/* Hidden video element for frame source */}
            <video
              ref={videoRef}
              preload="auto"
              muted
              playsInline
              style={{ display: "none" }}
              src="/loading.mp4"
            />
            {/* Canvas for rendering video frames */}
            <canvas
              ref={canvasRef}
              className="video-canvas"
            />
          </div>
        </div>
      ) : (
        <Homepage />
      )}
    </>
  );
};

export default Loader;