"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Alarm } from "@/lib/types";
import * as audioPlayer from "@/lib/audioPlayer";

interface AlarmPlayerProps {
  alarm: Alarm;
}

export default function AlarmPlayer({ alarm }: AlarmPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [snoozeActive, setSnoozeActive] = useState(false);
  const [snoozeRemaining, setSnoozeRemaining] = useState(0);
  const [selectedSnoozeDuration, setSelectedSnoozeDuration] = useState(alarm.snoozeOptions[0] || 5);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const snoozeIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

        // Start playback
        if (audioBufferRef.current) {
          audioPlayer.playAudio(audioBufferRef.current);
          setIsPlaying(true);
        }
      } catch (error) {
        console.error("Failed to initialize audio:", error);
      }
    };

    initAndPlay();

    // Cleanup on unmount
    return () => {
      audioPlayer.stopAudio();
    };
  }, [alarm]);

  const handleDismiss = useCallback(() => {
    audioPlayer.stopAudio();
    setIsPlaying(false);
    setSnoozeActive(false);
    if (snoozeIntervalRef.current) {
      clearInterval(snoozeIntervalRef.current);
    }
    // Redirect to home
    window.location.href = "/";
  }, []);

  const handleSnooze = useCallback(() => {
    audioPlayer.startSnooze(selectedSnoozeDuration, (remaining) => {
      setSnoozeRemaining(remaining);
      if (remaining <= 0) {
        setSnoozeActive(false);
      }
    });

    setSnoozeActive(true);
    setIsPaused(true);
    setSnoozeRemaining(selectedSnoozeDuration * 60 * 1000);
  }, [selectedSnoozeDuration]);

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

      {/* Snooze Duration Selector (shown when not snoozed) */}
      {!snoozeActive && isPlaying && (
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Snooze duration:</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {alarm.snoozeOptions.map((duration) => (
              <button
                key={duration}
                onClick={() => setSelectedSnoozeDuration(duration)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedSnoozeDuration === duration
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-gray-300 text-gray-800 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {duration}m
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={handleSnooze}
          disabled={!isPlaying || snoozeActive}
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
