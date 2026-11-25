// A short two-note chime for new notifications, made with the Web Audio API
// (no sound file to load). Browsers block audio until the user has interacted
// with the page, so the context is created/resumed on the first click or key
// press; before that, play calls are silently skipped.

let ctx: AudioContext | null = null;
let unlockBound = false;
let lastPlayed = 0;

const MUTE_KEY = 'sutura:notification-sound-muted';

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    ctx = null;
  }
  return ctx;
}

/** Call once on the client; resumes audio on the user's first interaction. */
export function bindNotificationSoundUnlock(): void {
  if (typeof window === 'undefined' || unlockBound) return;
  unlockBound = true;
  const unlock = () => {
    const c = getContext();
    if (c && c.state === 'suspended') void c.resume().catch(() => {});
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

export function isNotificationSoundMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setNotificationSoundMuted(muted: boolean): void {
  try {
    if (muted) window.localStorage.setItem(MUTE_KEY, '1');
    else window.localStorage.removeItem(MUTE_KEY);
  } catch {
    // Storage blocked: the setting just won't persist.
  }
}

export function playNotificationSound(): void {
  if (typeof window === 'undefined' || isNotificationSoundMuted()) return;
  // Several bells/tabs can poll at once; one chime per couple of seconds is enough.
  const now = Date.now();
  if (now - lastPlayed < 2000) return;
  const c = getContext();
  if (!c || c.state !== 'running') return;
  lastPlayed = now;

  try {
    const start = c.currentTime;
    // Two soft sine notes (E6 then A6), each with a quick attack and gentle fade.
    [[1318.5, 0], [1760, 0.12]].forEach(([freq, offset]) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = start + offset;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch {
    // Audio unavailable; the visual badge still updates.
  }
}
