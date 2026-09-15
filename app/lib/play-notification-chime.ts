/**
 * In-app notification chime — reliable Web Audio path (MCP Context 7).
 *
 * Why this was flaky before:
 * - HTMLAudio play() is blocked by autoplay until a real user gesture
 * - Reusing one <audio> element fails intermittently (Safari / load races)
 * - Pending chimes were dropped when unlock + play weren’t the same path
 *
 * Fix:
 * - Prefer Web Audio API (AudioContext + decoded buffer) after one unlock
 * - Preload the mp3 bytes early; decode once context is running
 * - HTMLAudio fallback if Web Audio isn’t available
 * - Queue while hidden/locked; flush on gesture, focus, or tab visible
 *
 * Related: BusinessNotifications, NotificationChimeBootstrap, unread hooks
 */

const NOTIFICATION_CHIME_SRC = "/notification-chime.mp3";
const MIN_PLAY_GAP_MS = 500;
const VOLUME = 0.75;

type PlayResult = "played" | "debounced" | "queued";

type ChimeState = {
  unlocked: boolean;
  pending: boolean;
  lastPlayAt: number;
  playInFlight: boolean;
  gestureAttached: boolean;
  visibilityAttached: boolean;
  rawBytes: ArrayBuffer | null;
  rawLoadPromise: Promise<ArrayBuffer> | null;
  audioCtx: AudioContext | null;
  audioBuffer: AudioBuffer | null;
  htmlAudio: HTMLAudioElement | null;
};

const state: ChimeState = {
  unlocked: false,
  pending: false,
  lastPlayAt: 0,
  playInFlight: false,
  gestureAttached: false,
  visibilityAttached: false,
  rawBytes: null,
  rawLoadPromise: null,
  audioCtx: null,
  audioBuffer: null,
  htmlAudio: null,
};

// --- Environment ---

function canUseDom(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function isDocumentVisible(): boolean {
  if (!canUseDom()) return false;
  return document.visibilityState === "visible";
}

function getAudioContextConstructor(): (typeof AudioContext) | null {
  if (!canUseDom()) return null;
  const w = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

// --- Preload mp3 bytes (no AudioContext needed yet) ---

function preloadChimeBytes(): Promise<ArrayBuffer> {
  if (state.rawBytes) return Promise.resolve(state.rawBytes);
  if (state.rawLoadPromise) return state.rawLoadPromise;

  state.rawLoadPromise = fetch(NOTIFICATION_CHIME_SRC)
    .then((res) => {
      if (!res.ok) throw new Error(`chime fetch failed: ${res.status}`);
      return res.arrayBuffer();
    })
    .then((buf) => {
      // Copy so decodeAudioData can’t detach the cached buffer (Safari).
      state.rawBytes = buf.slice(0);
      return state.rawBytes;
    })
    .catch((err) => {
      state.rawLoadPromise = null;
      throw err;
    });

  return state.rawLoadPromise;
}

// --- Web Audio ---

function getOrCreateAudioContext(): AudioContext | null {
  const Ctor = getAudioContextConstructor();
  if (!Ctor) return null;
  if (!state.audioCtx) {
    state.audioCtx = new Ctor();
  }
  return state.audioCtx;
}

async function resumeAudioContext(): Promise<boolean> {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return false;
  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    const running = ctx.state === "running";
    if (running) state.unlocked = true;
    return running;
  } catch {
    return false;
  }
}

async function ensureDecodedBuffer(): Promise<AudioBuffer | null> {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return null;
  if (state.audioBuffer) return state.audioBuffer;

  try {
    const bytes = await preloadChimeBytes();
    // decodeAudioData may consume the buffer — pass a copy every time.
    state.audioBuffer = await ctx.decodeAudioData(bytes.slice(0));
    return state.audioBuffer;
  } catch {
    return null;
  }
}

async function playViaWebAudio(): Promise<boolean> {
  const resumed = await resumeAudioContext();
  if (!resumed) return false;

  const buffer = await ensureDecodedBuffer();
  const ctx = state.audioCtx;
  if (!buffer || !ctx) return false;

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = VOLUME;
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(0);
  state.unlocked = true;
  return true;
}

// --- HTMLAudio fallback ---

function getHtmlAudio(): HTMLAudioElement | null {
  if (!canUseDom()) return null;
  if (state.htmlAudio) return state.htmlAudio;
  const audio = new Audio(NOTIFICATION_CHIME_SRC);
  audio.preload = "auto";
  audio.volume = VOLUME;
  try {
    audio.load();
  } catch {
    // ignore
  }
  state.htmlAudio = audio;
  return audio;
}

async function playViaHtmlAudio(): Promise<boolean> {
  const audio = getHtmlAudio();
  if (!audio) return false;
  try {
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      // metadata not ready yet
    }
    audio.muted = false;
    audio.volume = VOLUME;
    await audio.play();
    state.unlocked = true;
    return true;
  } catch {
    return false;
  }
}

/** Silent HTMLAudio unlock — helps browsers that gate HTMLAudio separately. */
async function unlockHtmlAudioSilent(): Promise<boolean> {
  const audio = getHtmlAudio();
  if (!audio) return false;
  const wasMuted = audio.muted;
  audio.muted = true;
  try {
    await audio.play();
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      // ignore
    }
    audio.muted = wasMuted;
    return true;
  } catch {
    audio.muted = wasMuted;
    return false;
  }
}

// --- Unlock (must run in user-gesture stack when possible) ---

async function unlockAudioPipeline(): Promise<boolean> {
  // Resume Web Audio first — this is the reliable path for later plays.
  const webOk = await resumeAudioContext();
  if (webOk) {
    void ensureDecodedBuffer();
  }
  // Also warm HTMLAudio in the same gesture when possible.
  await unlockHtmlAudioSilent();

  const unlocked = webOk || state.unlocked;
  state.unlocked = unlocked;
  return unlocked;
}

// --- Play / queue ---

async function attemptAudiblePlay(): Promise<PlayResult> {
  if (!canUseDom()) return "debounced";

  if (!isDocumentVisible()) {
    state.pending = true;
    ensureGestureUnlock();
    return "queued";
  }

  if (state.playInFlight) {
    state.pending = true;
    return "queued";
  }

  const now = Date.now();
  if (now - state.lastPlayAt < MIN_PLAY_GAP_MS) {
    return "debounced";
  }

  state.playInFlight = true;

  try {
    // Prefer Web Audio; fall back to HTMLAudio if needed.
    let ok = await playViaWebAudio();
    if (!ok) {
      ok = await playViaHtmlAudio();
    }

    if (ok) {
      state.lastPlayAt = Date.now();
      state.pending = false;
      state.unlocked = true;
      return "played";
    }

    // Autoplay still blocked — queue until the next real gesture.
    state.pending = true;
    state.unlocked = false;
    ensureGestureUnlock();
    return "queued";
  } finally {
    state.playInFlight = false;
  }
}

async function flushPendingIfReady(): Promise<void> {
  if (!state.pending) return;
  if (!isDocumentVisible()) return;

  // Try resume again (tab focus often allows AudioContext.resume).
  await resumeAudioContext();

  if (!state.unlocked) {
    ensureGestureUnlock();
    return;
  }

  await attemptAudiblePlay();
}

// --- Listeners ---

function ensureGestureUnlock(): void {
  if (!canUseDom() || state.gestureAttached) return;
  state.gestureAttached = true;

  const onUserGesture = () => {
    void (async () => {
      await unlockAudioPipeline();
      if (state.pending) {
        await flushPendingIfReady();
      }
    })();
  };

  window.addEventListener("pointerdown", onUserGesture, true);
  window.addEventListener("keydown", onUserGesture, true);
  window.addEventListener("touchstart", onUserGesture, {
    capture: true,
    passive: true,
  });
}

function ensureVisibilityFlush(): void {
  if (!canUseDom() || state.visibilityAttached) return;
  state.visibilityAttached = true;

  const onVisible = () => {
    if (document.visibilityState !== "visible") return;
    void (async () => {
      await resumeAudioContext();
      await flushPendingIfReady();
    })();
  };

  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", onVisible);
}

// --- Public API ---

export function installNotificationChimeUnlock(): void {
  if (!canUseDom()) return;
  void preloadChimeBytes().catch(() => {});
  getOrCreateAudioContext();
  getHtmlAudio();
  ensureGestureUnlock();
  ensureVisibilityFlush();
}

export function unlockNotificationChime(): void {
  if (!canUseDom()) return;
  installNotificationChimeUnlock();

  void (async () => {
    const ok = await unlockAudioPipeline();
    if (!ok) {
      ensureGestureUnlock();
      return;
    }
    await flushPendingIfReady();
  })();
}

export function playNotificationChime(): void {
  if (!canUseDom()) return;
  installNotificationChimeUnlock();

  void (async () => {
    const result = await attemptAudiblePlay();
    if (result === "queued") {
      ensureGestureUnlock();
    }
  })();
}
