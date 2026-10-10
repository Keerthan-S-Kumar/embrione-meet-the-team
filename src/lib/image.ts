/**
 * Client-side WebP conversion (runs in the browser, before anything is uploaded).
 *
 * How it works:
 *  1. createImageBitmap decodes the file. `imageOrientation: "from-image"` applies the EXIF
 *     rotation, so phone photos don't come out sideways.
 *  2. We draw the bitmap onto an off-screen <canvas>, shrunk so the longest side is <= 800px.
 *  3. canvas.toBlob(..., "image/webp", 0.8) re-encodes it as WebP at 80% quality.
 *
 * A 6 MB phone photo typically becomes ~60-120 KB.
 */

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_SIDE = 800;
const QUALITY = 0.8;

export interface ConvertedImage {
  blob: Blob;
  width: number;
  height: number;
  originalBytes: number;
  originalType: string;
  webpBytes: number;
}

export async function convertToWebp(file: File): Promise<ConvertedImage> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Please choose a PNG, JPG or JPEG image.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("That image is over 15 MB. Pick a smaller one.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("We couldn't read that image. Try a different file.");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process images here.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));

  // Some older browsers silently fall back to PNG when they can't encode WebP.
  if (!blob || blob.type !== "image/webp") {
    throw new Error("This browser can't create WebP images. Try Chrome, Edge or Firefox.");
  }

  return { blob, width, height, originalBytes: file.size, originalType: file.type, webpBytes: blob.size };
}
