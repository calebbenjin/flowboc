"use client";

type CompressOptions = {
  maxDimension?: number;
  quality?: number;
};

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.82;

// Resizes + re-encodes an image client-side before it ever reaches Blob
// storage — a phone photo is routinely 10-20MB at 4000px+ wide, far more
// than any cover/avatar/background slot here ever displays. Animated GIFs
// pass through untouched (canvas re-encoding would flatten them to one
// frame); anything that fails to decode (corrupt file, unsupported variant)
// falls back to uploading the original rather than blocking the user.
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  if (file.type === "image/gif" || !file.type.startsWith("image/")) return file;

  const maxDimension = opts.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = opts.quality ?? DEFAULT_QUALITY;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
