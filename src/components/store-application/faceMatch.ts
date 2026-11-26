/**
 * Compares the applicant's face with the photo on the ID they hold in the selfie, on the
 * device (face-api, pinned 1.7.15, models served from /models/face-api). The face data never
 * leaves the device: only the result and a distance go to SUTURA, as a hint for the review
 * team. It never blocks the application (a small printed ID photo often scores poorly even
 * for the right person). MediaPipe still does the quick "is there a face" check.
 */

export type FaceMatchResult = 'likely' | 'unsure' | 'no_match' | 'no_id_face' | 'not_checked';
export interface FaceMatch { result: FaceMatchResult; distance: number | null }

const MODELS = '/models/face-api';
// face-api's own cut-off is 0.6. An ID photo is small and printed, so "unsure" gets a little room.
const LIKELY_MAX = 0.5;
const UNSURE_MAX = 0.62;

type FaceApi = typeof import('@vladmandic/face-api');
let apiPromise: Promise<FaceApi> | null = null;

function loadFaceApi(): Promise<FaceApi> {
  apiPromise ??= (async () => {
    const faceapi = await import('@vladmandic/face-api');
    // The bundled TensorFlow has ready(); face-api's type file just doesn't list it.
    await (faceapi.tf as unknown as { ready: () => Promise<void> }).ready();
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODELS),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODELS),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODELS),
    ]);
    return faceapi;
  })();
  // Let a later attempt retry after a network failure.
  apiPromise.catch(() => { apiPromise = null; });
  return apiPromise;
}

/** Start downloading early (when the camera opens), so the check is quick at capture time. */
export function preloadFaceMatch(): void {
  loadFaceApi().catch(() => { /* reported as not_checked at capture time */ });
}

type Box = { x: number; y: number; width: number; height: number };
const overlap = (a: Box, b: Box) => {
  const w = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const h = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return (w * h) / Math.min(a.width * a.height, b.width * b.height);
};

async function compare(canvas: HTMLCanvasElement): Promise<FaceMatch> {
  const faceapi = await loadFaceApi();
  const find = (inputSize: number, scoreThreshold: number) => faceapi
    .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  // The ID photo is a small face: if the first pass only finds the applicant, look closer.
  let faces = await find(608, 0.3);
  if (faces.length < 2) faces = await find(832, 0.25);

  // Biggest face = the applicant; the next one that isn't the same face = the ID photo.
  const sorted = [...faces].sort((a, b) => b.detection.box.area - a.detection.box.area);
  const person = sorted[0];
  const idFace = person && sorted.slice(1).find((f) => overlap(f.detection.box, person.detection.box) < 0.3);
  if (!person || !idFace) return { result: 'no_id_face', distance: null };

  const distance = Math.round(faceapi.euclideanDistance(person.descriptor, idFace.descriptor) * 1000) / 1000;
  const result: FaceMatchResult = distance <= LIKELY_MAX ? 'likely' : distance <= UNSURE_MAX ? 'unsure' : 'no_match';
  return { result, distance };
}

/** Never throws: anything that goes wrong (slow network, old device) is "not checked". */
export async function matchSelfieFaces(canvas: HTMLCanvasElement, timeoutMs = 25000): Promise<FaceMatch> {
  try {
    return await Promise.race([
      compare(canvas),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
  } catch {
    return { result: 'not_checked', distance: null };
  }
}

// The result travels with the photo it belongs to, so the forms don't need extra state:
// a retaken selfie is a new File with its own result.
const results = new WeakMap<File, FaceMatch>();
export const rememberFaceMatch = (file: File, match: FaceMatch) => results.set(file, match);

/** Adds the selfie's face check (if any) to a form being sent. */
export function appendFaceMatch(form: FormData, selfie: File | undefined | null): void {
  const match = selfie ? results.get(selfie) : undefined;
  if (!match) return;
  form.append('face_match', match.result);
  if (match.distance !== null) form.append('face_match_distance', String(match.distance));
}
