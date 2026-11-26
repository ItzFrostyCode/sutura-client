'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import type { FaceDetector } from '@mediapipe/tasks-vision';
import { RequirementTag } from './ApplicationFields';
import { matchSelfieFaces, preloadFaceMatch, rememberFaceMatch, type FaceMatchResult } from './faceMatch';

/**
 * "Take a selfie holding your government ID": live camera capture only (no
 * gallery upload). A face check runs on the device before the photo is
 * accepted; whether the face matches the ID is judged by the review team.
 *
 * The face-detection files (~13 MB, pinned version) load only once the camera
 * is opened. If they can't load, the photo is still accepted and the owner is
 * told the review team will check it — never a silent pass.
 *
 * A second check (faceMatch.ts) compares the face with the photo on the ID. It only
 * warns: the owner can always continue, and the review team sees the result.
 */

// Shown under the photo when the face comparison has something the owner can fix.
const MATCH_HINTS: Partial<Record<FaceMatchResult, string>> = {
  no_id_face: 'We couldn’t find the photo on your ID. If you can, tap Retake and hold the ID a little closer, with its photo facing the camera. You can also continue; our review team will check it.',
  no_match: 'Our quick check couldn’t match your face with the photo on your ID. Make sure it’s your own ID, held flat with its photo facing the camera, then tap Retake. You can also continue; our review team will check it.',
};

const MEDIAPIPE_VERSION = '1.1.1';
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

type Phase = 'idle' | 'starting' | 'live' | 'checking' | 'done' | 'error';
type DetectorState = { detector: FaceDetector | null; failed: boolean };

let detectorPromise: Promise<FaceDetector> | null = null;
function loadDetector(): Promise<FaceDetector> {
  detectorPromise ??= (async () => {
    const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
    return FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL },
      runningMode: 'IMAGE',
      minDetectionConfidence: 0.6,
    });
  })();
  // Let a later attempt retry after a network failure.
  detectorPromise.catch(() => { detectorPromise = null; });
  return detectorPromise;
}

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera access is blocked. Allow camera access for this site in your browser settings, then tap Try again.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No camera was found on this device. Connect a webcam, or fill in the application on your phone.';
  }
  if (name === 'NotReadableError') {
    return 'Your camera is being used by another app. Close that app, then tap Try again.';
  }
  return 'We couldn’t start your camera. Tap Try again, or use a different browser or device.';
}

export default function SelfieCapture({ id, file, idType, onChange }: {
  readonly id: string;
  readonly file: File | undefined;
  readonly idType: string;
  readonly onChange: (file: File | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<DetectorState>({ detector: null, failed: false });
  const [phase, setPhase] = useState<Phase>(file ? 'done' : 'idle');
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [hint, setHint] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  // Preview of the accepted photo (also after stepping Back and returning).
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    setMessage('');
    setNote('');
    setHint('');
    if (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setPhase('error');
      setMessage('The camera only works on a secure (https) page in an up-to-date browser. Open SUTURA in Chrome, Safari, or Edge.');
      return;
    }
    setPhase('starting');
    // Start loading the face check alongside the camera.
    if (!detectorRef.current.detector) {
      detectorRef.current.failed = false;
      loadDetector()
        .then((d) => { detectorRef.current = { detector: d, failed: false }; })
        .catch(() => { detectorRef.current = { detector: null, failed: true }; });
    }
    preloadFaceMatch();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setPhase('live');
      // The <video> mounts with the live phase.
      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => { /* autoplay is muted + playsInline, so this only fails if the stream already ended */ });
        }
      });
    } catch (err) {
      stopCamera();
      setPhase('error');
      setMessage(cameraErrorMessage(err));
    }
  };

  const waitForDetector = async (): Promise<FaceDetector | null> => {
    if (detectorRef.current.detector) return detectorRef.current.detector;
    try {
      return await Promise.race([
        loadDetector(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000)),
      ]);
    } catch {
      return null;
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setMessage('The camera is still starting. Wait a moment, then tap Take photo again.');
      return;
    }
    setMessage('');
    setPhase('checking');

    // Saved un-mirrored, so the ID's text reads the right way for the reviewer.
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const detector = await waitForDetector();
    if (detector) {
      let faces = 0;
      try {
        faces = detector.detect(canvas).detections.length;
      } catch {
        faces = -1;
      }
      if (faces === 0) {
        setPhase('live');
        setMessage('We can’t see your face clearly. Face the camera in good light, keep your whole face in the frame, and take the photo again.');
        return;
      }
      if (faces < 0) setNote('The automatic face check didn’t run. Our review team will check your photo instead.');
    } else {
      setNote('The automatic face check couldn’t load on this connection. Our review team will check your photo instead.');
    }

    const match = await matchSelfieFaces(canvas);
    setHint(MATCH_HINTS[match.result] ?? '');

    canvas.toBlob((blob) => {
      if (!blob) {
        setPhase('live');
        setMessage('We couldn’t save that photo. Please take it again.');
        return;
      }
      stopCamera();
      const photo = new File([blob], 'selfie-with-id.jpg', { type: 'image/jpeg' });
      rememberFaceMatch(photo, match);
      onChange(photo);
      setPhase('done');
    }, 'image/jpeg', 0.9);
  };

  const retake = () => {
    onChange(null);
    startCamera();
  };

  const idName = idType || 'government ID';

  return (
    <div>
      <p className="text-sm text-ink mb-1" id={`${id}-label`}>
        Selfie holding your ID<RequirementTag value="Required" />
      </p>
      <p className="mobile-caption text-ink-muted mb-3">
        Take a photo of yourself holding your {idName} next to your face, front side toward the camera. Your device
        compares your face with the ID photo (only the result is sent, never your face data), and our review team
        checks it too. Camera only; photos from your gallery can&apos;t be used.
      </p>

      <div className="border border-line-strong bg-surface" aria-labelledby={`${id}-label`}>
        {(phase === 'live' || phase === 'checking') && (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink">
            {/* Mirrored like a mirror, which is easier to line up; the saved photo isn't. */}
            <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" aria-label="Live camera preview" />
            {phase === 'checking' && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
                <span className="flex items-center gap-2 bg-surface px-3.5 py-2 text-sm text-ink">
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Checking your photo…
                </span>
              </div>
            )}
          </div>
        )}

        {phase === 'done' && preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your selfie holding your ID" className="aspect-[4/3] w-full bg-sunken object-contain" />
        )}

        {(phase === 'idle' || phase === 'starting' || phase === 'error') && (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 bg-sunken px-6 text-center">
            <Camera size={32} className="text-ink-muted" aria-hidden="true" />
            <ul className="mobile-caption text-ink-body space-y-1">
              <li>Find good light and remove sunglasses or a cap.</li>
              <li>Keep your whole face and the ID inside the frame.</li>
              <li>Hold the ID still so its photo and name are readable.</li>
            </ul>
          </div>
        )}

        <div className="flex min-h-14 flex-wrap items-center gap-3 border-t border-line px-4 py-3">
          {phase === 'done' ? (
            <>
              <CheckCircle2 size={18} className="shrink-0 text-sage" aria-hidden="true" />
              <span className="min-w-0 flex-1 text-sm text-ink">Selfie taken</span>
              <button type="button" onClick={retake} className="inline-flex min-h-11 items-center gap-2 border border-line-strong px-4 text-sm text-ink hover:bg-sunken">
                <RotateCcw size={16} aria-hidden="true" /> Retake
              </button>
            </>
          ) : phase === 'live' || phase === 'checking' ? (
            <>
              <span className="min-w-0 flex-1 mobile-caption text-ink-muted">Hold still, then take the photo.</span>
              <button type="button" onClick={capture} disabled={phase === 'checking'}
                className="inline-flex min-h-11 items-center gap-2 bg-ink px-5 text-sm font-semibold uppercase tracking-widest text-white disabled:opacity-50">
                <Camera size={16} aria-hidden="true" /> Take photo
              </button>
            </>
          ) : (
            <button type="button" onClick={startCamera} disabled={phase === 'starting'}
              className="inline-flex min-h-11 items-center gap-2 border border-ink px-5 text-sm font-semibold uppercase tracking-widest text-ink hover:bg-sunken disabled:opacity-50">
              {phase === 'starting' ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
              {phase === 'starting' ? 'Starting camera…' : phase === 'error' ? 'Try again' : 'Open camera'}
            </button>
          )}
        </div>
      </div>

      {message && <p role="alert" className="mt-2 text-xs text-danger">{message}</p>}
      {hint && phase === 'done' && <p role="status" className="mt-2 text-xs text-amber-800">{hint}</p>}
      {note && phase === 'done' && <p role="status" className="mt-2 text-xs text-ink-muted">{note}</p>}
    </div>
  );
}
