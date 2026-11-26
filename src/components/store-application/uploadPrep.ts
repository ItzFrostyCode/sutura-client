/**
 * Gets a picked file ready to send, on any device.
 *
 * Phone photos are often 3–6 MB (and HEIC on iPhones), while the server takes JPG/PNG/WEBP/PDF and PHP's
 * default upload limit is 2 MB per file and 8 MB per request. A photo that is too big fails only at the
 * final Submit, on a different step, with a vague message. So every photo is redrawn here as a JPEG of at
 * most MAX_SIDE pixels (still sharp enough to read a certificate), and anything that can't be sent is
 * refused right where it was picked, with what to do instead.
 */

const MAX_SIDE = 2000;
const QUALITY = 0.85;
/** PHP's stock upload_max_filesize. A bigger PDF is refused by the server before Laravel even sees it. */
export const MAX_PDF_BYTES = 2 * 1024 * 1024;
/** Under PHP's stock post_max_size (8 MB), which covers the whole application in one request. */
export const MAX_TOTAL_BYTES = 7 * 1024 * 1024;

export type Prepared = { file: File; error?: undefined } | { file?: undefined; error: string };

export const megabytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const isPdf = (f: File) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
const isImage = (f: File) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(f.name);

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
    img.src = url;
  });
}

/** The image drawn on a canvas (white behind transparent parts), at most maxSide pixels on its longer side. */
export async function imageToCanvas(file: File, maxSide = MAX_SIDE): Promise<HTMLCanvasElement> {
  // Modern browsers apply the photo's EXIF rotation when drawing it, so a sideways phone photo comes out upright.
  const img = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function canvasToJpeg(canvas: HTMLCanvasElement, name: string, quality = QUALITY): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('encode'));
      resolve(new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() }));
    }, 'image/jpeg', quality);
  });
}

const jpegName = (name: string) => `${name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`;

/**
 * Returns the file to send, or the reason it can't be used. `allowPdf` false = photos only.
 */
export async function prepareUpload(file: File, { allowPdf = true }: { readonly allowPdf?: boolean } = {}): Promise<Prepared> {
  if (isPdf(file)) {
    if (!allowPdf) return { error: 'Use a photo here (JPG or PNG), not a PDF.' };
    if (file.size > MAX_PDF_BYTES) {
      return { error: `This PDF is ${megabytes(file.size)}; the limit is ${megabytes(MAX_PDF_BYTES)}. Take a clear photo of the document instead, or use a smaller PDF.` };
    }
    return { file };
  }
  if (!isImage(file)) {
    return { error: allowPdf ? 'Use a photo (JPG or PNG) or a PDF.' : 'Use a photo (JPG or PNG).' };
  }
  try {
    const canvas = await imageToCanvas(file);
    let out = await canvasToJpeg(canvas, jpegName(file.name));
    if (out.size > 1.5 * 1024 * 1024) out = await canvasToJpeg(canvas, jpegName(file.name), 0.7);
    return { file: out };
  } catch {
    if (/\.(heic|heif)$/i.test(file.name) || /hei[cf]/i.test(file.type)) {
      return { error: 'This browser can’t open HEIC photos. Take the photo again with your camera set to “Most Compatible” (JPG), or send a screenshot of it.' };
    }
    return { error: 'We couldn’t open this photo. Try taking it again, or pick a different one.' };
  }
}
