"use client";

import { useState, useEffect, useCallback } from "react";
import { ReactorProvider, ReactorView } from "@reactor-team/js-sdk";
import { HeaderControls } from "@/components/HeaderControls";
import { ConnectionPanel } from "@/components/ConnectionPanel";
import { OverlayControls } from "@/components/OverlayControls";
import { ImageUploader } from "@/components/ImageUploader";
import { Button } from "@/components/ui/button";
import { useReactor } from "@reactor-team/js-sdk";
import { Maximize2, Minimize2 } from "lucide-react";

// Reset button component (needs to be inside ReactorProvider)
function ResetButton() {
  const { sendCommand, status } = useReactor((state) => ({
    sendCommand: state.sendCommand,
    status: state.status,
  }));

  const handleReset = async () => {
    try {
      await sendCommand("reset", {});
      console.log("Reset command sent");
    } catch (error) {
      console.error("Failed to send reset:", error);
    }
  };

  if (status !== "ready") return null;

  return (
    <Button
      size="xs"
      variant="destructive"
      onClick={handleReset}
      className="backdrop-blur-sm"
    >
      Reset
    </Button>
  );
}

// Speed controls component (needs to be inside ReactorProvider)
function SpeedControls() {
  const { sendCommand, status } = useReactor((state) => ({
    sendCommand: state.sendCommand,
    status: state.status,
  }));

  const [movementSpeed, setMovementSpeed] = useState(1.0);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);

  const handleMovementSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const speed = parseFloat(e.target.value);
    setMovementSpeed(speed);
    if (status === "ready") {
      void sendCommand("set_movement_speed", { speed });
    }
  };

  const handleRotationSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const speed = parseFloat(e.target.value);
    setRotationSpeed(speed);
    if (status === "ready") {
      void sendCommand("set_rotation_speed", { speed });
    }
  };

  if (status !== "ready") return null;

  return (
    <div className="flex items-center gap-4 px-3 py-2 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/70 uppercase tracking-wide">Move</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={movementSpeed}
          onChange={handleMovementSpeedChange}
          className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <span className="text-[10px] text-white/70 font-mono w-6">{movementSpeed.toFixed(1)}</span>
      </div>
      <div className="w-px h-4 bg-white/20" />
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/70 uppercase tracking-wide">Rotate</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={rotationSpeed}
          onChange={handleRotationSpeedChange}
          className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-accent"
        />
        <span className="text-[10px] text-white/70 font-mono w-6">{rotationSpeed.toFixed(1)}</span>
      </div>
    </div>
  );
}

export default function Page() {
  const [jwtToken, setJwtToken] = useState<string | undefined>(undefined);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Ensure dark mode is applied to html element
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Handle fullscreen changes (e.g., user pressing Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <ReactorProvider
        modelName="hy-world"
        jwtToken={jwtToken}
        local={isLocalMode}
        autoConnect={false}
      >
        {/* Header */}
        <HeaderControls />

        {/* Main content - fills remaining viewport */}
        <main className={`flex-1 min-h-0 ${isFullscreen ? "flex flex-col" : "p-3 md:p-4"}`}>
          <div className={`${isFullscreen ? "flex-1 flex flex-col" : "h-full max-w-5xl mx-auto flex flex-col gap-3"}`}>
            {/* Connection panel - above the video */}
            {!isFullscreen && (
              <ConnectionPanel
                onJwtTokenChange={setJwtToken}
                onLocalModeChange={setIsLocalMode}
                className="shrink-0"
              />
            )}

            {/* Game view with overlay controls - flexes to fill available space */}
            <div className="relative bg-black rounded-lg overflow-hidden border border-border flex-1 min-h-0">
              {/* Video view */}
              <div className="absolute inset-0">
                <ReactorView className="w-full h-full object-contain" />
              </div>

              {/* Overlay controls - float on top */}
              <OverlayControls className="absolute inset-0" />

              {/* Top-left: Reset button */}
              <div className="absolute top-3 left-3 pointer-events-auto">
                <ResetButton />
              </div>

              {/* Top-center: Speed controls */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-auto">
                <SpeedControls />
              </div>

              {/* Top-right: Fullscreen toggle */}
              <div className="absolute top-3 right-3 pointer-events-auto">
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={toggleFullscreen}
                  className="backdrop-blur-sm bg-black/40 border-white/10 hover:bg-black/60"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Controls panel - stays at bottom */}
            <div className={`shrink-0 ${
              isFullscreen 
                ? "p-3 flex gap-3 bg-card border-t border-border" 
                : "p-3 flex gap-3 bg-card rounded-lg border border-border"
            }`}>
              <ImageUploader className="border-0 p-0 bg-transparent" />
            </div>
          </div>
        </main>
      </ReactorProvider>
    </div>
  );
}
