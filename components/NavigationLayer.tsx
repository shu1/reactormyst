"use client";

import { useReactor } from "@reactor-team/js-sdk";
import { useCallback } from "react";
import { resizeImage } from "@/lib/image-utils";

interface NavigationLayerProps {
    currentImageId: string | null;
    onNavigate: (imageId: string) => void;
    className?: string;
}

export function NavigationLayer({ currentImageId, onNavigate, className = "" }: NavigationLayerProps) {
    const { sendCommand, status } = useReactor((state) => ({
        sendCommand: state.sendCommand,
        status: state.status,
    }));

    const handleClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
        if (status !== "ready") return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const relativeX = x / width;

        console.log(`[Navigation] Click at ${relativeX.toFixed(2)}, currentImageId: ${currentImageId}`);

        let nextImageId: string | null = null;

        if (currentImageId === "00") {
            if (relativeX < 0.33) { // Left
                nextImageId = "03";
            } else if (relativeX >= 0.33 && relativeX < 0.66) { // Middle
                nextImageId = "04";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "01";
            }
        } else if (currentImageId === "01") {
            if (relativeX < 0.33) { // Left
                nextImageId = "00";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "02";
            }
        } else if (currentImageId === "02") {
            if (relativeX < 0.33) { // Left
                nextImageId = "01";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "03";
            }
        } else if (currentImageId === "03") {
            if (relativeX < 0.33) { // Left
                nextImageId = "02";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "00";
            }
        } else if (currentImageId === "04") {
            if (relativeX < 0.66) { // Left + Middle
                nextImageId = "06";
            } else { // Right
                nextImageId = "05";
            }
        } else if (currentImageId === "05") {
            if (relativeX < 0.33) { // Left
                nextImageId = "04";
            } else if (relativeX >= 0.33 && relativeX < 0.66) { // Middle
                nextImageId = "02";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "04";
            }
        } else if (currentImageId === "06") {
            if (relativeX < 0.33) { // Left
                nextImageId = "07";
            } else if (relativeX >= 0.33 && relativeX < 0.66) { // Middle
                nextImageId = "07";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "10";
            }
        } else if (currentImageId === "07") {
            if (relativeX < 0.33) { // Left
                nextImageId = "08";
            } else if (relativeX >= 0.33 && relativeX < 0.66) { // Middle
                nextImageId = "12";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "09";
            }
        } else if (currentImageId === "08") {
            if (relativeX < 0.33) { // Left
                nextImageId = "10";
            } else if (relativeX >= 0.33 && relativeX < 0.66) { // Middle
                nextImageId = "05";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "07";
            }
        } else if (currentImageId === "09") {
            if (relativeX < 0.33) { // Left
                nextImageId = "07";
            } else if (relativeX >= 0.33 && relativeX < 0.66) { // Middle
                nextImageId = "10";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "08";
            }
        } else if (currentImageId === "10") {
            if (relativeX < 0.33) { // Left
                nextImageId = "11";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "11";
            }
        } else if (currentImageId === "11") {
            if (relativeX < 0.33) { // Left
                nextImageId = "10";
            } else if (relativeX >= 0.33 && relativeX < 0.66) { // Middle
                nextImageId = "07";
            }
        } else if (currentImageId === "12") {
            if (relativeX < 0.33) { // Left
                nextImageId = "13";
            } else { // Middle + Right
                nextImageId = "15";
            }
        } else if (currentImageId === "13") {
            if (relativeX < 0.33) { // Left
                nextImageId = "14";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "12";
            }
        } else if (currentImageId === "14") {
            if (relativeX < 0.33) { // Left
                nextImageId = "15";
            } else if (relativeX >= 0.33 && relativeX < 0.66) { // Middle
                nextImageId = "09";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "13";
            }
        } else if (currentImageId === "15") {
            if (relativeX >= 0.33 && relativeX < 0.66) { // Middle
                nextImageId = "16";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "14";
            }
        } else if (currentImageId === "16") {
            if (relativeX < 0.33) { // Left
                nextImageId = "17";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "17";
            }
        } else if (currentImageId === "17") {
            if (relativeX < 0.33) { // Left
                nextImageId = "14";
            } else if (relativeX >= 0.33 && relativeX < 0.66) { // Middle
                nextImageId = "13";
            } else if (relativeX >= 0.66) { // Right
                nextImageId = "16";
            }
        }

        if (nextImageId) {
            try {
                console.log(`[Navigation] Navigating to ${nextImageId}...`);

                // 1. Fetch
                const response = await fetch(`/img/${nextImageId}.png`);
                if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
                const blob = await response.blob();

                // 2. Read & Resize
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64String = reader.result as string;
                    const resized = await resizeImage(base64String);
                    const base64Data = resized.split(",")[1];

                    // 3. Send
                    await sendCommand("set_starting_image", {
                        image_base64: base64Data,
                    });

                    // 4. Update State
                    onNavigate(nextImageId!);
                    console.log(`[Navigation] Navigated to ${nextImageId}`);
                };
                reader.readAsDataURL(blob);

            } catch (error) {
                console.error(`[Navigation] Failed to navigate to ${nextImageId}:`, error);
            }
        }
    }, [currentImageId, status, sendCommand, onNavigate]);

    return (
        <div
            className={`absolute inset-0 z-10 cursor-pointer ${className}`}
            onClick={handleClick}
        />
    );
}
