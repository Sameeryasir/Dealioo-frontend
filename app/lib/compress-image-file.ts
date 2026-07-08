type CompressImageOptions = {
  maxBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

const DEFAULT_MAX_BYTES = 900_000;
const DEFAULT_MAX_DIMENSION = 1200;
const DEFAULT_QUALITY = 0.82;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image file."));
    };
    img.src = url;
  });
}

function scaleToFit(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Shrinks large restaurant logos so prod nginx (often 1MB limit) accepts the upload.
 */
export async function compressImageForUpload(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_DIMENSION;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_DIMENSION;
  const baseQuality = options.quality ?? DEFAULT_QUALITY;

  if (file.size <= maxBytes) {
    return file;
  }

  const img = await loadImageFromFile(file);
  const { width, height } = scaleToFit(img.width, img.height, maxWidth, maxHeight);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return file;
  }

  ctx.drawImage(img, 0, 0, width, height);

  const outputType = "image/jpeg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "logo";
  let quality = baseQuality;
  let blob = await canvasToBlob(canvas, outputType, quality);

  while (blob && blob.size > maxBytes && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, outputType, quality);
  }

  if (!blob || blob.size >= file.size) {
    return file;
  }

  return new File([blob], `${baseName}.jpg`, {
    type: outputType,
    lastModified: Date.now(),
  });
}
