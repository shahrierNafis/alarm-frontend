// Web Audio API wrapper for alarm playback and snooze control

export interface AudioPlayerContext {
  audioContext: AudioContext;
  audioBuffer: AudioBuffer | null;
  audioSource: AudioBufferSourceNode | null;
  gainNode: GainNode;
  isPlaying: boolean;
  isPaused: boolean;
}

let playerContext: AudioPlayerContext | null = null;
let snoozeTimeout: NodeJS.Timeout | null = null;
let snoozeCountdownInterval: NodeJS.Timeout | null = null;
let currentSnoozeEndTime: number = 0;

// Initialize audio context
function getAudioContext(): AudioContext {
  if (playerContext?.audioContext) {
    return playerContext.audioContext;
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioContext;
}

// Load audio from blob
export async function loadAudioFromBlob(blob: Blob): Promise<AudioBuffer> {
  const audioContext = getAudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}

// Generate default alarm beep (sine wave at 800Hz)
export function generateDefaultAlarmBeep(durationSeconds: number = 2): AudioBuffer {
  const audioContext = getAudioContext();
  const sampleRate = audioContext.sampleRate;
  const totalSamples = sampleRate * durationSeconds;
  const audioBuffer = audioContext.createBuffer(1, totalSamples, sampleRate);
  const channel = audioBuffer.getChannelData(0);

  const frequency = 800; // Hz
  for (let i = 0; i < totalSamples; i++) {
    channel[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.3; // 0.3 = volume
  }

  return audioBuffer;
}

// Play audio
export function playAudio(audioBuffer: AudioBuffer): void {
  const audioContext = getAudioContext();

  // Stop any currently playing audio
  if (playerContext?.audioSource) {
    try {
      playerContext.audioSource.stop();
    } catch (e) {
      // already stopped
    }
  }

  // Create new source
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = true; // Loop the alarm sound

  // Create gain node for volume control
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 1; // 100% volume

  // Connect nodes: source -> gain -> destination (speakers)
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Start playback
  source.start(0);

  playerContext = {
    audioContext,
    audioBuffer,
    audioSource: source,
    gainNode,
    isPlaying: true,
    isPaused: false,
  };
}

// Stop audio
export function stopAudio(): void {
  if (playerContext?.audioSource) {
    try {
      playerContext.audioSource.stop();
      playerContext.isPlaying = false;
      playerContext.isPaused = false;
    } catch (e) {
      // already stopped
    }
  }

  // Clear any pending snooze
  if (snoozeTimeout) {
    clearTimeout(snoozeTimeout);
    snoozeTimeout = null;
  }
  if (snoozeCountdownInterval) {
    clearInterval(snoozeCountdownInterval);
    snoozeCountdownInterval = null;
  }
}

// Pause audio (for snooze)
export function pauseAudio(): void {
  if (playerContext?.audioContext && playerContext?.isPlaying) {
    try {
      playerContext.audioContext.suspend();
      playerContext.isPaused = true;
    } catch (e) {
      console.error("Failed to pause audio:", e);
    }
  }
}

// Resume audio (after snooze)
export function resumeAudio(): void {
  if (playerContext?.audioContext && playerContext?.isPaused) {
    try {
      playerContext.audioContext.resume();
      playerContext.isPaused = false;
    } catch (e) {
      console.error("Failed to resume audio:", e);
    }
  }
}

// Start snooze: pause audio for duration, then resume
export function startSnooze(
  durationMinutes: number,
  onSnoozeUpdate?: (remainingMs: number) => void,
  onSnoozeEnd?: () => void,
): void {
  pauseAudio();

  const durationMs = durationMinutes * 60 * 1000;
  currentSnoozeEndTime = Date.now() + durationMs;

  // Update countdown every 100ms
  snoozeCountdownInterval = setInterval(() => {
    const now = Date.now();
    const remaining = Math.max(0, currentSnoozeEndTime - now);

    if (onSnoozeUpdate) {
      onSnoozeUpdate(remaining);
    }

    if (remaining <= 0) {
      clearInterval(snoozeCountdownInterval!);
      snoozeCountdownInterval = null;
      resumeAudio();
      if (onSnoozeEnd) {
        onSnoozeEnd();
      }
    }
  }, 100);
}

// Get current snooze remaining time
export function getSnoozeRemaining(): number {
  if (currentSnoozeEndTime === 0) return 0;
  return Math.max(0, currentSnoozeEndTime - Date.now());
}

// Check if audio is currently playing
export function isAudioPlaying(): boolean {
  return playerContext?.isPlaying ?? false;
}

// Check if audio is paused
export function isAudioPaused(): boolean {
  return playerContext?.isPaused ?? false;
}

// Set volume (0-1)
export function setVolume(volume: number): void {
  if (playerContext?.gainNode) {
    playerContext.gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }
}
