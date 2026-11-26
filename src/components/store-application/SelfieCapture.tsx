'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, ImageUp, Loader2, RotateCcw } from 'lucide-react';
import type { FaceDetector } from '@mediapipe/tasks-vision';
import { BTN_PILL, BTN_PRIMARY, BTN_SECONDARY, Req } from './ApplicationFields';
import { matchSelfieFaces, preloadFaceMatch, rememberFaceMatch, type FaceMatchResult } from './faceMatch';
import { canvasToJpeg, imageToCanvas } from './uploadPrep';

/**
 * "Take a selfie holding your government ID", on any device:
 *
 * - Phones and tablets open their own camera app (a file input with capture="user"). That works on plain http, in
 *   in-app browsers (Messenger, Facebook) and on every phone browser, where a live camera on the page often can't.
 * - Computers use the live camera on the page; if it can't start (no webcam, blocked, not https), the owner can
 *   use a photo instead.
 *
 * Every photo is redrawn small (uploadPrep) before it is checked and sent. A quick face check runs on the device
 * (MediaPipe); a second one compares the face with the ID photo (faceMatch.ts) and only warns. If the checks can't
 * load or run in time, the photo is still accepted and the owner is told the review team will check it.
 */

const MATCH_HINTS: Partial<Record<FaceMatchResult, string>> = {
  no_id_face: 'We couldn’t find the photo on your ID. If you can, retake it with the ID a little closer, its photo facing the camera. You can also continue; our review team will check it.',
  no_match: 'Our quick check couldn’t match your face with the photo on your ID. Make sure it’s your own ID, held flat with its photo facing the camera, then retake it. You can also continue; our review team will check it.',
};

const MEDIAPIPE_VERSION = '1.1.1';
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
/** Longest side of the saved selfie: plenty for a reviewer to read the ID, small enough for any connection. */
const SELFIE_SIDE = 1600;

type Phase = 'idle' | 'starting' | 'live' | 'checking' | 'done' | 'error';

/**
 * MediaPipe's WebAssembly writes its own status lines to console.error ("INFO: Created TensorFlow Lite XNNPACK
 * delegate for CPU.", glog lines like "W0000 00:00:...") although nothing is wrong. The Next.js dev overlay shows
 * every console.error as an error, so only those lines are dropped; every other error still goes through.
 */
let mediapipeLogsQuiet = false;
function quietMediapipeLogs(): void {
  if (mediapipeLogsQuiet || typeof console === 'undefined') return;
  mediapipeLogsQuiet = true;
  const original = console.error.bind(console);
  const isMediapipeStatus = (first: unknown) => typeof first === 'string'
    && (/^INFO: /.test(first) || /^[IWE]\d{4} \d\d:\d\d:\d\d/.test(first))
    && /TensorFlow Lite|XNNPACK|delegate|inference|gl_context|graph|calculator|landmark|feedback/i.test(first);
  console.error = (...args: unknown[]) => {
    if (isMediapipeStatus(args[0])) return;
    original(...args);
  };
}

let detectorPromise: Promise<FaceDetector> | null = null;
function loadDetector(): Promise<FaceDetector> {
  quietMediapipeLogs();
  detectorPromise ??= (async () => {
    const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
    return FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL },
      runningMode: 'IMAGE',
      minDetectionConfidence: 0.6,
    });
  })();
  detectorPromise.catch(() => { detectorPromise = null; }); // a later attempt can retry
  return detectorPromise;
}

const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Camera access is blocked for this site. Allow it in your browser settings and try again, or use a photo instead.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera was found on this computer. Use a photo instead, or fill in the application on your phone.';
  if (name === 'NotReadableError') return 'Your camera is being used by another app. Close that app and try again, or use a photo instead.';
  return 'We couldn’t start your camera. Try again, or use a photo instead.';
}

/** Phones and tablets: their camera app is the reliable way in. */
const touchFirst = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
/** A live camera on the page needs https (or localhost) and a browser that offers it. */
const liveCameraAvailable = () => typeof window !== 'undefined' && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;

export default function SelfieCapture({ id, file, idType, onChange, invalid = false }: {
  readonly id: string;
  readonly file: File | undefined;
  readonly idType: string;
  readonly onChange: (file: File | null) => void;
  /** Ringed red after Continue when no selfie was taken. */
  readonly invalid?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pickRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>(file ? 'done' : 'idle');
  // Read on the device itself (this step only ever appears after the page has loaded, so there's no server render to match).
  const [useCameraApp, setUseCameraApp] = useState(() => touchFirst() || !liveCameraAvailable());
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [hint, setHint] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  // Decided after mounting (the server doesn't know the device).
  useEffect(() => { setUseCameraApp(touchFirst() || !liveCameraAvailable()); }, []);

  // The photo can arrive later (kept through a refresh) or be cleared from outside: follow it.
  useEffect(() => {
    if (file) setPhase((p) => (p === 'live' || p === 'checking' ? p : 'done'));
    else setPhase((p) => (p === 'done' ? 'idle' : p));
  }, [file]);

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

  // Attach the stream once the <video> is on screen (a fixed delay is not enough on slower phones).
  useEffect(() => {
    if (phase !== 'live') return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream || video.srcObject === stream) return;
    video.srcObject = stream;
    video.play().catch(() => { /* muted + playsInline: only fails if the stream already ended */ });
  }, [phase]);

  /** Checks a photo (from the live camera or the camera app) and keeps it if a face is there. */
  const accept = async (canvas: HTMLCanvasElement) => {
    setMessage('');
    setNote('');
    setHint('');
    setPhase('checking');
    let detector: FaceDetector | null = null;
    try { detector = await withTimeout(loadDetector(), 12000); } catch { detector = null; }
    if (detector) {
      let faces = -1;
      try { faces = detector.detect(canvas).detections.length; } catch { faces = -1; }
      if (faces === 0) {
        setPhase(streamRef.current ? 'live' : 'idle');
        setMessage('We can’t see your face clearly. Face the camera in good light, keep your whole face in the frame, and take the photo again.');
        return;
      }
      if (faces < 0) setNote('The automatic face check didn’t run. Our review team will check your photo instead.');
    } else {
      setNote('The automatic face check couldn’t load on this connection. Our review team will check your photo instead.');
    }
    const match = await matchSelfieFaces(canvas, 15000);
    setHint(MATCH_HINTS[match.result] ?? '');
    try {
      const photo = await canvasToJpeg(canvas, 'selfie-with-id.jpg', 0.88);
      stopCamera();
      rememberFaceMatch(photo, match);
      onChange(photo);
      setPhase('done');
    } catch {
      setPhase(streamRef.current ? 'live' : 'idle');
      setMessage('We couldn’t save that photo. Please take it again.');
    }
  };

  // ----- Computers: the live camera -----
  const startCamera = async () => {
    setMessage('');
    setNote('');
    setHint('');
    if (!liveCameraAvailable()) {
      setPhase('error');
      setMessage('This browser can’t open the camera on this page. Use a photo instead.');
      return;
    }
    setPhase('starting');
    loadDetector().catch(() => { /* reported at capture */ });
    preloadFaceMatch();
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setPhase('live');
    } catch (err) {
      stopCamera();
      setPhase('error');
      setMessage(cameraErrorMessage(err));
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setMessage('The camera is still starting. Wait a moment, then tap Take photo again.');
      return;
    }
    // Saved un-mirrored, so the ID's text reads the right way for the reviewer.
    const scale = Math.min(1, SELFIE_SIDE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    void accept(canvas);
  };

  // ----- Phones (and the fallback): the camera app -----
  const openCameraApp = () => {
    setMessage('');
    preloadFaceMatch();
    loadDetector().catch(() => { /* reported at capture */ });
    pickRef.current?.click();
  };

  const onPicked = async (picked: File | undefined) => {
    if (!picked) return;
    try {
      const canvas = await imageToCanvas(picked, SELFIE_SIDE);
      await accept(canvas);
    } catch {
      setPhase('idle');
      setMessage(/hei[cf]/i.test(picked.type) || /\.(heic|heif)$/i.test(picked.name)
        ? 'This browser can’t open HEIC photos. Set your camera to “Most Compatible” (JPG) and take it again.'
        : 'We couldn’t open that photo. Please take it again.');
    }
  };

  const retake = () => {
    onChange(null);
    setHint('');
    setNote('');
    if (useCameraApp) openCameraApp(); else void startCamera();
  };

  const idName = idType || 'government ID';
  const small = 'min-h-11! px-5! text-[15px]!';

  return (
    <div>
      {/* The camera app (phones) or a photo (fallback). capture="user" opens the front camera where supported. */}
      <input ref={pickRef} id={id} type="file" accept="image/*" capture="user" className="sr-only" tabIndex={-1} aria-hidden="true"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void onPicked(f); }} />

      <div className={`overflow-hidden rounded-2xl bg-surface ring-1 ${invalid ? 'ring-danger/70' : 'ring-line/80'}`} aria-labelledby={`${id}-label`}>
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <p id={`${id}-label`} className="text-[15px] font-medium text-ink">Selfie holding your ID<Req /></p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">
            Hold your {idName} next to your face, front side toward the camera.{useCameraApp ? ' This opens your phone’s camera.' : ''} Your
            device compares your face with the ID photo (only the result is sent, never your face data), and our review team checks it too.
          </p>
        </div>

        <div className="p-4 sm:p-5">
          {/* 4:3 while there is a picture (never wider than a phone screen); a short tip box before that. */}
          <div className={`relative w-full overflow-hidden rounded-xl bg-sunken ${phase === 'live' || phase === 'checking' || (phase === 'done' && preview) ? 'mx-auto aspect-[4/3] sm:max-w-md' : 'min-h-44'}`}>
            {phase === 'live' && (
              // Mirrored like a mirror, which is easier to line up; the saved photo isn't.
              <video ref={videoRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" aria-label="Live camera preview" />
            )}
            {phase === 'checking' && (
              <div className="flex h-full w-full items-center justify-center">
                <span className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-[15px] text-ink shadow-sm">
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Checking your photo…
                </span>
              </div>
            )}
            {phase === 'done' && preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Your selfie holding your ID" className="h-full w-full object-contain" />
            )}
            {(phase === 'idle' || phase === 'starting' || phase === 'error' || (phase === 'done' && !preview)) && (
              <div className="flex min-h-44 w-full flex-col items-center justify-center gap-3 px-6 py-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-ink-muted shadow-sm"><Camera size={26} aria-hidden="true" /></span>
                <ul className="space-y-1 text-[13px] text-ink-body">
                  <li>Find good light; remove sunglasses or a cap.</li>
                  <li>Keep your whole face and the ID in the frame.</li>
                  <li>Hold the ID still so its photo and name are readable.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-16 flex-wrap items-center gap-3 border-t border-line/80 px-4 py-3 sm:px-5">
          {phase === 'done' ? (
            <>
              <CheckCircle2 size={20} className="shrink-0 text-sage" aria-hidden="true" />
              <span className="min-w-0 flex-1 text-[15px] font-medium text-ink">Selfie taken</span>
              <button type="button" onClick={retake} className={BTN_PILL}>
                <RotateCcw size={15} aria-hidden="true" /> Retake
              </button>
            </>
          ) : phase === 'live' ? (
            <>
              <span className="min-w-0 flex-1 text-[13px] text-ink-muted">Hold still, then take the photo.</span>
              <button type="button" onClick={capture} className={`${BTN_PRIMARY} ${small}`}>
                <Camera size={17} aria-hidden="true" /> Take photo
              </button>
            </>
          ) : phase === 'checking' ? (
            <span className="text-[13px] text-ink-muted">This takes a few seconds.</span>
          ) : useCameraApp ? (
            <button type="button" onClick={openCameraApp} className={`${BTN_PRIMARY} ${small} w-full sm:w-auto`}>
              <Camera size={17} aria-hidden="true" /> Take selfie
            </button>
          ) : (
            <>
              <button type="button" onClick={startCamera} disabled={phase === 'starting'} className={`${BTN_SECONDARY} ${small}`}>
                {phase === 'starting' ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Camera size={17} aria-hidden="true" />}
                {phase === 'starting' ? 'Starting camera…' : phase === 'error' ? 'Try again' : 'Open camera'}
              </button>
              {phase === 'error' && (
                <button type="button" onClick={openCameraApp} className="inline-flex min-h-11 cursor-pointer items-center gap-2 px-2 text-[15px] font-semibold text-ink underline underline-offset-2">
                  <ImageUp size={17} aria-hidden="true" /> Use a photo instead
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {message && <p role="alert" className="mt-2 text-[13px] text-danger">{message}</p>}
      {hint && phase === 'done' && <p role="status" className="mt-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">{hint}</p>}
      {note && phase === 'done' && <p role="status" className="mt-2 text-[13px] text-ink-muted">{note}</p>}
    </div>
  );
}
