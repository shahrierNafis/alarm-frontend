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

// Volume ramp tracking
let volumeRampAnimationId: number | null = null;
let volumeRampState: {
  startVolume: number;
  targetVolume: number;
  startTime: number;
  durationMs: number;
  isPaused: boolean;
  pausedAtTime: number;
} | null = null;

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
export function playAudio(audioBuffer: AudioBuffer, startingVolumePercent: number = 100): void {
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
  const initialVolume = Math.max(0, Math.min(100, startingVolumePercent)) / 100;
  gainNode.gain.value = initialVolume; // Set to starting volume

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

  // Stop volume ramp
  stopVolumeRamp();
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
  pauseVolumeRamp(); // Pause volume ramp during snooze

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
      resumeVolumeRamp(); // Resume volume ramp after snooze ends
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

// Start volume ramp: gradually increase from starting volume to 100% over duration
export function startVolumeRamp(
  startingVolumePercent: number,
  durationSeconds: number,
  onRampProgress?: (currentVolume: number) => void,
  onRampComplete?: () => void,
): void {
  if (!playerContext?.gainNode) {
    console.error("Cannot start volume ramp: no audio context");
    return;
  }

  // Stop any existing ramp
  stopVolumeRamp();

  const startVolume = Math.max(0, Math.min(100, startingVolumePercent)) / 100;
  const targetVolume = 1.0; // 100%
  const durationMs = durationSeconds * 1000;

  volumeRampState = {
    startVolume,
    targetVolume,
    startTime: Date.now(),
    durationMs,
    isPaused: false,
    pausedAtTime: 0,
  };

  const animateRamp = () => {
    if (!volumeRampState || !playerContext?.gainNode) {
      return;
    }

    const now = Date.now();
    const elapsedMs = now - volumeRampState.startTime;
    const progress = Math.min(1, elapsedMs / volumeRampState.durationMs);
    const currentVolume =
      volumeRampState.startVolume + (volumeRampState.targetVolume - volumeRampState.startVolume) * progress;

    playerContext.gainNode.gain.value = currentVolume;

    if (onRampProgress) {
      onRampProgress(currentVolume);
    }

    if (progress >= 1) {
      // Ramp complete
      volumeRampState = null;
      volumeRampAnimationId = null;
      if (onRampComplete) {
        onRampComplete();
      }
    } else {
      // Continue ramp
      volumeRampAnimationId = requestAnimationFrame(animateRamp);
    }
  };

  volumeRampAnimationId = requestAnimationFrame(animateRamp);
}

// Pause volume ramp (used during snooze)
export function pauseVolumeRamp(): void {
  if (volumeRampState && !volumeRampState.isPaused) {
    volumeRampState.isPaused = true;
    volumeRampState.pausedAtTime = Date.now();

    if (volumeRampAnimationId !== null) {
      cancelAnimationFrame(volumeRampAnimationId);
      volumeRampAnimationId = null;
    }
  }
}

// Resume volume ramp (after snooze ends)
export function resumeVolumeRamp(): void {
  if (volumeRampState && volumeRampState.isPaused) {
    const pausedDuration = Date.now() - volumeRampState.pausedAtTime;
    volumeRampState.startTime += pausedDuration;
    volumeRampState.isPaused = false;

    const animateRamp = () => {
      if (!volumeRampState || !playerContext?.gainNode) {
        return;
      }

      const now = Date.now();
      const elapsedMs = now - volumeRampState.startTime;
      const progress = Math.min(1, elapsedMs / volumeRampState.durationMs);
      const currentVolume =
        volumeRampState.startVolume + (volumeRampState.targetVolume - volumeRampState.startVolume) * progress;

      playerContext.gainNode.gain.value = currentVolume;

      if (progress >= 1) {
        // Ramp complete
        volumeRampState = null;
        volumeRampAnimationId = null;
      } else {
        // Continue ramp
        volumeRampAnimationId = requestAnimationFrame(animateRamp);
      }
    };

    volumeRampAnimationId = requestAnimationFrame(animateRamp);
  }
}

// Stop volume ramp
export function stopVolumeRamp(): void {
  if (volumeRampAnimationId !== null) {
    cancelAnimationFrame(volumeRampAnimationId);
    volumeRampAnimationId = null;
  }
  volumeRampState = null;
}
