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
import { resizeImage } from "@/lib/image-utils";
import { NavigationLayer } from "@/components/NavigationLayer";

// Start button component - uploads img/00.png as starting image
function StartButton({ onStart }: { onStart: () => void }) {
  const { sendCommand, status } = useReactor((state) => ({
    sendCommand: state.sendCommand,
    status: state.status,
  }));
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (status !== "ready") return;

    try {
      setIsLoading(true);
      console.log("Fetching img/00.png...");

      // Fetch the default image
      // Note: using absolute path from public root
      const response = await fetch("/img/00.png");
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          // Resize/normalize using shared utility
          const resized = await resizeImage(base64String);
          const base64Data = resized.split(",")[1];

          await sendCommand("set_starting_image", {
            image_base64: base64Data,
          });
          onStart();
          console.log("Start: default image set successfully");
        } catch (err) {
          console.error("Failed to process start image:", err);
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        console.error("Failed to read start image blob");
        setIsLoading(false);
      };
      reader.readAsDataURL(blob);

    } catch (error) {
      console.error("Failed to start:", error);
      setIsLoading(false);
    }
  };

  if (status !== "ready") return null;

  return (
    <Button
      size="xs"
      variant="default" // Green/primary distinct from destructive Reset
      onClick={handleStart}
      disabled={isLoading}
      className="backdrop-blur-sm bg-green-600/90 hover:bg-green-600 border-green-500/50"
    >
      {isLoading ? "Loading..." : "Start"}
    </Button>
  );
}

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


export default function Page() {
  const [jwtToken, setJwtToken] = useState<string | undefined>(undefined);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);

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
        modelName="worldcore"
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

              {/* Navigation Layer - intercepts clicks */}
              <NavigationLayer
                currentImageId={currentImageId}
                onNavigate={setCurrentImageId}
              />

              {/* Overlay controls - float on top */}
              <OverlayControls className="absolute inset-0 pointer-events-none" />

              {/* Top-left: Reset & Start buttons */}
              <div className="absolute top-3 left-3 pointer-events-auto flex gap-2 z-20">
                <StartButton onStart={() => setCurrentImageId("00")} />
                <ResetButton />
              </div>

              {/* Top-right: Fullscreen toggle */}
              <div className="absolute top-3 right-3 pointer-events-auto z-20">
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
          </div>
        </main>
      </ReactorProvider>
    </div>
  );
}
