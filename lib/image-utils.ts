// Target dimensions matching the model's expected input.
// Images are normalized to exactly this size (letter/pillar-boxed) and
// re-encoded as JPEG to keep the payload under the WebRTC data channel limit.
export const TARGET_WIDTH = 640;
export const TARGET_HEIGHT = 360;
export const INITIAL_JPEG_QUALITY = 0.7;
// WebRTC data channel safe limit – the base64 payload (plus JSON wrapper)
// must stay under this. 200 KB is well within the 256 KB SCTP limit.
export const MAX_BASE64_BYTES = 200_000;

/**
 * Normalize an image to exactly TARGET_WIDTH × TARGET_HEIGHT (letter/pillar-boxed
 * with a black background), then JPEG-encode it. If the resulting base64 exceeds
 * MAX_BASE64_BYTES the quality is reduced iteratively until it fits.
 */
export function resizeImage(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = TARGET_WIDTH;
            canvas.height = TARGET_HEIGHT;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Failed to get canvas context"));
                return;
            }

            // Black background for letter/pillar-boxing
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

            // Fit the image inside the canvas preserving aspect ratio
            const aspectRatio = img.width / img.height;
            const targetAspect = TARGET_WIDTH / TARGET_HEIGHT;
            let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;

            if (aspectRatio > targetAspect) {
                // Image is wider → pillar-box (black bars top/bottom)
                drawWidth = TARGET_WIDTH;
                drawHeight = TARGET_WIDTH / aspectRatio;
                offsetX = 0;
                offsetY = (TARGET_HEIGHT - drawHeight) / 2;
            } else {
                // Image is taller → letter-box (black bars left/right)
                drawHeight = TARGET_HEIGHT;
                drawWidth = TARGET_HEIGHT * aspectRatio;
                offsetX = (TARGET_WIDTH - drawWidth) / 2;
                offsetY = 0;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, img.width, img.height, offsetX, offsetY, drawWidth, drawHeight);

            // Encode as JPEG, reducing quality iteratively until the base64 fits
            let quality = INITIAL_JPEG_QUALITY;
            let result = canvas.toDataURL("image/jpeg", quality);

            while (result.length > MAX_BASE64_BYTES && quality > 0.1) {
                quality -= 0.1;
                result = canvas.toDataURL("image/jpeg", quality);
            }

            console.log(
                `[ImageUtils] Normalized image: ${TARGET_WIDTH}x${TARGET_HEIGHT}, ` +
                `quality=${quality.toFixed(1)}, size=${(result.length / 1024).toFixed(1)}KB`
            );
            resolve(result);
        };
        img.onerror = () => reject(new Error("Failed to load image for resizing"));
        img.src = dataUrl;
    });
}
