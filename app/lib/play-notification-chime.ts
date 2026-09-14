const NOTIFICATION_CHIME_SRC = "/notification-chime.mp3";

let chimeAudio: HTMLAudioElement | null = null;
let lastPlayAt = 0;

function getChimeAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (chimeAudio) return chimeAudio;
  chimeAudio = new Audio(NOTIFICATION_CHIME_SRC);
  chimeAudio.preload = "auto";
  chimeAudio.volume = 0.7;
  return chimeAudio;
}

export function unlockNotificationChime(): void {
  const audio = getChimeAudio();
  if (!audio) return;
  const wasMuted = audio.muted;
  audio.muted = true;
  void audio
    .play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = wasMuted;
    })
    .catch(() => {
      audio.muted = wasMuted;
    });
}

export function playNotificationChime(): void {
  const audio = getChimeAudio();
  if (!audio) return;

  const now = Date.now();
  if (now - lastPlayAt < 800) return;
  lastPlayAt = now;

  try {
    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  } catch {
  }
}
