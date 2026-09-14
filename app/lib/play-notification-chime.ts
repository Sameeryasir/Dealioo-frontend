const NOTIFICATION_CHIME_SRC = "/notification-chime.mp3";
const MIN_PLAY_GAP_MS = 600;

let unlocked = false;
let unlockListenersAttached = false;
let pendingPlay = false;
let lastPlayAt = 0;
let sharedAudio: HTMLAudioElement | null = null;
let visibilityHandlerAttached = false;

function isDocumentVisible(): boolean {
  if (typeof document === "undefined") return false;
  return document.visibilityState === "visible";
}

function getSharedAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (sharedAudio) return sharedAudio;

  sharedAudio = new Audio(NOTIFICATION_CHIME_SRC);
  sharedAudio.preload = "auto";
  sharedAudio.volume = 0.7;
  try {
    sharedAudio.load();
  } catch {
  }
  return sharedAudio;
}

function resetPlaybackPosition(audio: HTMLAudioElement): void {
  try {
    audio.currentTime = 0;
  } catch {
  }
}

function attachUnlockListeners(): void {
  if (typeof window === "undefined" || unlockListenersAttached) return;
  unlockListenersAttached = true;

  const onUserGesture = () => {
    const audio = getSharedAudio();
    if (!audio) return;

    if (pendingPlay && isDocumentVisible()) {
      const now = Date.now();
      if (now - lastPlayAt >= MIN_PLAY_GAP_MS) {
        pendingPlay = false;
        lastPlayAt = now;
        audio.pause();
        resetPlaybackPosition(audio);
        audio.muted = false;
        audio.volume = 0.7;
        void audio
          .play()
          .then(() => {
            unlocked = true;
          })
          .catch(() => {
            pendingPlay = true;
            unlocked = false;
          });
        return;
      }
    }

    const wasMuted = audio.muted;
    audio.muted = true;
    void audio
      .play()
      .then(() => {
        audio.pause();
        resetPlaybackPosition(audio);
        audio.muted = wasMuted;
        unlocked = true;
      })
      .catch(() => {
        audio.muted = wasMuted;
      });
  };

  window.addEventListener("pointerdown", onUserGesture, true);
  window.addEventListener("keydown", onUserGesture, true);
}

function queuePendingAndWaitForGesture(): void {
  pendingPlay = true;
  unlocked = false;
  attachUnlockListeners();
}

async function unlockWithGesture(): Promise<boolean> {
  const audio = getSharedAudio();
  if (!audio) return false;

  const wasMuted = audio.muted;
  audio.muted = true;
  try {
    await audio.play();
    audio.pause();
    resetPlaybackPosition(audio);
    audio.muted = wasMuted;
    unlocked = true;
    return true;
  } catch {
    audio.muted = wasMuted;
    return false;
  }
}

async function playNow(): Promise<void> {
  if (!isDocumentVisible()) {
    pendingPlay = true;
    return;
  }

  const now = Date.now();
  if (now - lastPlayAt < MIN_PLAY_GAP_MS) return;

  const audio = getSharedAudio();
  if (!audio) return;

  try {
    audio.pause();
    resetPlaybackPosition(audio);
    audio.muted = false;
    audio.volume = 0.7;
    lastPlayAt = now;
    await audio.play();
    unlocked = true;
  } catch {
    lastPlayAt = 0;
    queuePendingAndWaitForGesture();
  }
}

export function installNotificationChimeUnlock(): void {
  if (typeof window === "undefined") return;

  getSharedAudio();
  attachUnlockListeners();

  if (visibilityHandlerAttached) return;
  visibilityHandlerAttached = true;

  const onVisible = () => {
    if (document.visibilityState !== "visible") return;
    if (!pendingPlay) return;
    if (!unlocked) {
      attachUnlockListeners();
      return;
    }
    pendingPlay = false;
    void playNow();
  };

  document.addEventListener("visibilitychange", onVisible);
}

export function unlockNotificationChime(): void {
  const audio = getSharedAudio();
  if (!audio) {
    attachUnlockListeners();
    return;
  }

  if (pendingPlay && isDocumentVisible()) {
    const now = Date.now();
    if (now - lastPlayAt >= MIN_PLAY_GAP_MS) {
      pendingPlay = false;
      lastPlayAt = now;
      audio.pause();
      resetPlaybackPosition(audio);
      audio.muted = false;
      audio.volume = 0.7;
      void audio
        .play()
        .then(() => {
          unlocked = true;
        })
        .catch(() => {
          pendingPlay = true;
          unlocked = false;
          attachUnlockListeners();
        });
      return;
    }
  }

  void unlockWithGesture().then((ok) => {
    if (!ok) attachUnlockListeners();
  });
}

export function playNotificationChime(): void {
  if (typeof window === "undefined") return;

  if (!isDocumentVisible()) {
    pendingPlay = true;
    attachUnlockListeners();
    return;
  }

  void playNow();
}
