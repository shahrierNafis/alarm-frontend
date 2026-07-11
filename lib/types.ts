// Types for alarm app

export interface Alarm {
  id: string; // unique identifier
  name: string; // alarm name (used in URL)
  soundData?: Blob; // audio file blob
  snoozeDuration: number; // custom snooze duration in minutes
  snoozeLimit: number | null; // maximum times snooze can be triggered (null for unlimited)
  createdAt: number; // timestamp
  volumeRampEnabled?: boolean; // whether to gradually increase volume
  startingVolume?: number; // starting volume as percentage (0-100)
  volumeRampDuration?: number; // duration of volume ramp in seconds
}

export interface AlarmState {
  alarms: Alarm[];
  addAlarm: (alarm: Omit<Alarm, "id" | "createdAt">) => Promise<void>;
  updateAlarm: (id: string, alarm: Partial<Alarm>) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  getAlarmByName: (name: string) => Alarm | undefined;
  loadAlarms: () => Promise<void>;
}

export interface AlarmPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  snoozeTimeRemaining: number; // in milliseconds
  snoozeInterval: NodeJS.Timeout | null;
  startPlayback: (soundBlob?: Blob) => void;
  stopPlayback: () => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  startSnooze: (durationMinutes: number) => void;
}
