/**
 * Makes a phone photo small enough to upload quickly before it is sent:
 * longest side at most 2000 px, saved as JPEG at 82% quality. A 3–8 MB photo
 * becomes about 300–600 KB while an ID or permit stays readable.
 *
 * Only JPEG / PNG / WebP photos over 500 KB are touched. PDFs, small images,
 * and anything the browser can't decode go through unchanged, and so does a
 * photo the re-save wouldn't actually make smaller. Never throws.
 */
const MAX_SIDE = 2000;
const QUALITY = 0.82;
const MIN_BYTES = 500_000;

export async function shrinkImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < MIN_BYTES) return file;
  try {
    // from-image applies the camera's rotation, so portrait photos stay upright.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.fillStyle = '#ffffff'; // a transparent PNG would otherwise turn black as JPEG
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const name = `${file.name.replace(/\.(jpe?g|png|webp)$/i, '')}.jpg`;
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    return file;
  }
}
