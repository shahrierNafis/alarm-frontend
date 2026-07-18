"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Alarm } from "@/lib/types";
import * as audioPlayer from "@/lib/audioPlayer";

interface AlarmPlayerProps {
  alarm: Alarm;
}

export default function AlarmPlayer({ alarm }: AlarmPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [snoozeActive, setSnoozeActive] = useState(false);
  const [snoozeRemaining, setSnoozeRemaining] = useState(0);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [volumeRampActive, setVolumeRampActive] = useState(false);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const snoozeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoDismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDismiss = useCallback(() => {
    audioPlayer.stopAudio();
    setIsPlaying(false);
    setSnoozeActive(false);
    if (snoozeIntervalRef.current) {
      clearInterval(snoozeIntervalRef.current);
    }
    if (autoDismissTimeoutRef.current) {
      clearTimeout(autoDismissTimeoutRef.current);
      autoDismissTimeoutRef.current = null;
    }
    // Redirect to home
    window.location.href = "/";
  }, []);

  const clearAutoDismissTimeout = useCallback(() => {
    if (autoDismissTimeoutRef.current) {
      clearTimeout(autoDismissTimeoutRef.current);
      autoDismissTimeoutRef.current = null;
    }
  }, []);

  const startAutoDismissTimer = useCallback(
    (durationMinutes: number) => {
      clearAutoDismissTimeout();
      if (durationMinutes > 0) {
        autoDismissTimeoutRef.current = setTimeout(
          () => {
            handleDismiss();
          },
          durationMinutes * 60 * 1000,
        );
      }
    },
    [clearAutoDismissTimeout, handleDismiss],
  );

  // Initialize audio and start playing
  useEffect(() => {
    const initAndPlay = async () => {
      try {
        // Load audio buffer
        if (alarm.soundData) {
          audioBufferRef.current = await audioPlayer.loadAudioFromBlob(alarm.soundData);
        } else {
          audioBufferRef.current = audioPlayer.generateDefaultAlarmBeep();
        }

        // Start playback with optional volume ramp
        if (audioBufferRef.current) {
          const startingVolume = alarm.volumeRampEnabled ? alarm.startingVolume || 100 : 100;
          audioPlayer.playAudio(audioBufferRef.current, startingVolume);
          setIsPlaying(true);

          // Start volume ramp if enabled
          if (alarm.volumeRampEnabled && alarm.volumeRampDuration) {
            setVolumeRampActive(true);
            audioPlayer.startVolumeRamp(alarm.startingVolume || 100, alarm.volumeRampDuration, undefined, () => {
              setVolumeRampActive(false);
            });
          }

          const dismissMinutes = alarm.autoDismissDuration ?? 10;
          if (dismissMinutes > 0) {
            startAutoDismissTimer(dismissMinutes);
          }
        }
      } catch (error) {
        console.error("Failed to initialize audio:", error);
      }
    };

    initAndPlay();

    // Cleanup on unmount
    return () => {
      audioPlayer.stopAudio();
      if (autoDismissTimeoutRef.current) {
        clearTimeout(autoDismissTimeoutRef.current);
      }
    };
  }, [alarm, handleDismiss]);

  const snoozeDuration = alarm.snoozeDuration ?? 5;
  const isSnoozeLimitReached =
    alarm.snoozeLimit !== null && alarm.snoozeLimit !== undefined && snoozeCount >= alarm.snoozeLimit;

  const handleSnooze = useCallback(() => {
    if (isSnoozeLimitReached) return;

    const autoDismissDuration = alarm.autoDismissDuration ?? 10;
    clearAutoDismissTimeout();

    audioPlayer.startSnooze(
      snoozeDuration,
      (remaining) => {
        setSnoozeRemaining(remaining);
      },
      () => {
        setSnoozeActive(false);
        setSnoozeRemaining(0);
        startAutoDismissTimer(autoDismissDuration);
      },
    );

    setSnoozeActive(true);
    setSnoozeRemaining(snoozeDuration * 60 * 1000);
    setSnoozeCount((prev) => prev + 1);
  }, [alarm.autoDismissDuration, clearAutoDismissTimeout, isSnoozeLimitReached, startAutoDismissTimer, snoozeDuration]);

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8">
      {/* Snooze Timer (shown when snooze is active) */}
      {snoozeActive && (
        <div className="text-center animate-pulse">
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Snooze Time Remaining</p>
          <div className="text-6xl font-bold text-black dark:text-white font-mono">
            {Math.floor(snoozeRemaining / 60000)
              .toString()
              .padStart(2, "0")}
            :
            {Math.floor((snoozeRemaining % 60000) / 1000)
              .toString()
              .padStart(2, "0")}
          </div>
        </div>
      )}

      {/* Volume Ramp Indicator */}
      {volumeRampActive && !snoozeActive && (
        <div className="text-center animate-pulse">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">🔊 Volume Gradually Increasing</p>
        </div>
      )}

      {/* Snooze Config & Status Info */}
      {isPlaying && (
        <div className="text-center bg-gray-50 dark:bg-zinc-900 px-6 py-4 rounded-xl shadow-inner border border-gray-150 dark:border-zinc-800 w-full max-w-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Snooze duration: <span className="font-semibold text-black dark:text-white">{snoozeDuration} min</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Auto-dismiss after:{" "}
            <span className="font-semibold text-black dark:text-white">{alarm.autoDismissDuration ?? 10} min</span>
          </p>
          <div className="text-sm mt-2 text-gray-500 dark:text-gray-400">
            {alarm.snoozeLimit === null || alarm.snoozeLimit === undefined ? (
              <p>
                Snoozed: <span className="font-semibold text-black dark:text-white">{snoozeCount}</span> times
                (Unlimited)
              </p>
            ) : (
              <div>
                <p>
                  Snoozed: <span className="font-semibold text-black dark:text-white">{snoozeCount}</span> of{" "}
                  <span className="font-semibold text-black dark:text-white">{alarm.snoozeLimit}</span> times
                </p>
                {isSnoozeLimitReached && (
                  <span className="block text-red-500 font-bold mt-1 text-xs animate-bounce">
                    ⚠️ Snooze limit reached!
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={handleSnooze}
          disabled={!isPlaying || snoozeActive || isSnoozeLimitReached}
          className="px-8 py-4 rounded-lg bg-yellow-500 text-white font-semibold text-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          💤 Snooze
        </button>
        <button
          onClick={handleDismiss}
          className="px-8 py-4 rounded-lg bg-red-600 text-white font-semibold text-lg hover:bg-red-700 transition-colors"
        >
          ✕ Dismiss
        </button>
      </div>
    </div>
  );
}
