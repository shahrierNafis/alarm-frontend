"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useAlarmStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Alarm } from "@/lib/types";

interface AlarmFormProps {
  onSuccess?: () => void;
  alarm?: Alarm;
  onEditCancel?: () => void;
}

export default function AlarmForm({ onSuccess, alarm, onEditCancel }: AlarmFormProps) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [snoozeDuration, setSnoozeDuration] = useState<number>(5);
  const [snoozeLimitType, setSnoozeLimitType] = useState<"unlimited" | "custom">("unlimited");
  const [snoozeLimitValue, setSnoozeLimitValue] = useState<number>(3);
  const [autoDismissDuration, setAutoDismissDuration] = useState<number>(10);
  const [volumeRampEnabled, setVolumeRampEnabled] = useState(false);
  const [startingVolume, setStartingVolume] = useState(20);
  const [volumeRampDuration, setVolumeRampDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const addAlarm = useAlarmStore((state) => state.addAlarm);
  const updateAlarm = useAlarmStore((state) => state.updateAlarm);

  const isEditMode = !!alarm;

  // Populate form when editing
  useEffect(() => {
    if (alarm) {
      setName(alarm.name);
      setSnoozeDuration(alarm.snoozeDuration ?? 5);
      if (alarm.snoozeLimit === null || alarm.snoozeLimit === undefined) {
        setSnoozeLimitType("unlimited");
        setSnoozeLimitValue(3);
      } else {
        setSnoozeLimitType("custom");
        setSnoozeLimitValue(alarm.snoozeLimit);
      }
      setAutoDismissDuration(alarm.autoDismissDuration ?? 10);
      setVolumeRampEnabled(alarm.volumeRampEnabled ?? false);
      setStartingVolume(alarm.startingVolume ?? 20);
      setVolumeRampDuration(alarm.volumeRampDuration ?? 30);
      setFile(null); // File handling is separate for editing
    }
  }, [alarm]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file is audio
      if (!selectedFile.type.startsWith("audio/")) {
        setError("Please select an audio file");
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  // Legacy handleSnoozeOptionChange removed

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate inputs
      if (!name.trim()) {
        setError("Alarm name is required");
        setIsLoading(false);
        return;
      }

      if (snoozeDuration <= 0) {
        setError("Snooze duration must be at least 1 minute");
        setIsLoading(false);
        return;
      }

      if (autoDismissDuration <= 0) {
        setError("Auto-dismiss duration must be at least 1 minute");
        setIsLoading(false);
        return;
      }

      if (snoozeLimitType === "custom" && snoozeLimitValue <= 0) {
        setError("Snooze limit must be at least 1");
        setIsLoading(false);
        return;
      }

      // Prepare sound data
      const soundData = file ? new Blob([file], { type: file.type }) : undefined;
      const snoozeLimit = snoozeLimitType === "custom" ? snoozeLimitValue : null;

      if (isEditMode && alarm) {
        // Update existing alarm
        await updateAlarm(alarm.id, {
          name: name.trim(),
          soundData: soundData || alarm.soundData, // Keep existing sound if not updating
          snoozeDuration,
          snoozeLimit,
          autoDismissDuration,
          volumeRampEnabled,
          startingVolume: volumeRampEnabled ? startingVolume : undefined,
          volumeRampDuration: volumeRampEnabled ? volumeRampDuration : undefined,
        });
      } else {
        // Create new alarm
        await addAlarm({
          name: name.trim(),
          soundData,
          snoozeDuration,
          snoozeLimit,
          autoDismissDuration,
          volumeRampEnabled,
          startingVolume: volumeRampEnabled ? startingVolume : undefined,
          volumeRampDuration: volumeRampEnabled ? volumeRampDuration : undefined,
        });

        // Reset form only when creating
        setName("");
        setFile(null);
        setSnoozeDuration(5);
        setSnoozeLimitType("unlimited");
        setSnoozeLimitValue(3);
        setAutoDismissDuration(10);
        setVolumeRampEnabled(false);
        setStartingVolume(20);
        setVolumeRampDuration(30);

        // Navigate to the alarm page only when creating
        router.push(`/alarm/${encodeURIComponent(name.trim())}`);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : isEditMode ? "Failed to update alarm" : "Failed to create alarm");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
      {/* Alarm Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Alarm Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Morning Wake-up"
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white dark:focus:ring-white/20"
          disabled={isLoading}
        />
      </div>

      {/* Sound Upload */}
      <div>
        <label htmlFor="sound" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Alarm Sound (Optional)
        </label>
        <div className="mt-2 flex items-center justify-center w-full">
          <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 transition-colors hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {file ? file.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">MP3, WAV, or other audio format</p>
            </div>
            <input
              type="file"
              id="sound"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </div>
      </div>

      {/* Snooze Duration */}
      <div>
        <label htmlFor="snoozeDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Snooze Duration (minutes)
        </label>
        <input
          type="number"
          id="snoozeDuration"
          min="1"
          value={snoozeDuration}
          onChange={(e) => setSnoozeDuration(Math.max(1, parseInt(e.target.value) || 0))}
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white dark:focus:ring-white/20"
          disabled={isLoading}
          required
        />
      </div>

      {/* Auto Dismiss */}
      <div>
        <label htmlFor="autoDismissDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Auto Dismiss After (minutes)
        </label>
        <input
          type="number"
          id="autoDismissDuration"
          min="1"
          value={autoDismissDuration}
          onChange={(e) => setAutoDismissDuration(Math.max(1, parseInt(e.target.value) || 0))}
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white dark:focus:ring-white/20"
          disabled={isLoading}
          required
        />
      </div>

      {/* Snooze Limit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Snooze Limit</label>
        <div className="flex gap-3 mb-3">
          <button
            type="button"
            onClick={() => setSnoozeLimitType("unlimited")}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors border ${
              snoozeLimitType === "unlimited"
                ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-750"
            }`}
          >
            Unlimited
          </button>
          <button
            type="button"
            onClick={() => setSnoozeLimitType("custom")}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors border ${
              snoozeLimitType === "custom"
                ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-750"
            }`}
          >
            Limit Snooze Count
          </button>
        </div>
        {snoozeLimitType === "custom" && (
          <div className="mt-2">
            <label
              htmlFor="snoozeLimitValue"
              className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
            >
              Max Snooze Count
            </label>
            <input
              type="number"
              id="snoozeLimitValue"
              min="1"
              value={snoozeLimitValue}
              onChange={(e) => setSnoozeLimitValue(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-white dark:focus:ring-white/20"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Alarm can be snoozed at most {snoozeLimitValue} {snoozeLimitValue === 1 ? "time" : "times"}.
            </p>
          </div>
        )}
      </div>

      {/* Volume Ramp Settings */}
      <div className="border-t border-gray-300 dark:border-gray-600 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="volumeRamp"
            checked={volumeRampEnabled}
            onChange={(e) => setVolumeRampEnabled(e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <label htmlFor="volumeRamp" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            Enable Gradually Increasing Volume
          </label>
        </div>

        {volumeRampEnabled && (
          <div className="space-y-4 ml-7 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {/* Starting Volume */}
            <div>
              <label
                htmlFor="startingVolume"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Starting Volume: {startingVolume}%
              </label>
              <input
                type="range"
                id="startingVolume"
                min="0"
                max="100"
                value={startingVolume}
                onChange={(e) => setStartingVolume(Number(e.target.value))}
                disabled={isLoading}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Volume will gradually increase from {startingVolume}% to 100%
              </p>
            </div>

            {/* Ramp Duration */}
            <div>
              <label
                htmlFor="volumeRampDuration"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Ramp Duration: {volumeRampDuration} seconds
              </label>
              <input
                type="range"
                id="volumeRampDuration"
                min="5"
                max="120"
                value={volumeRampDuration}
                onChange={(e) => setVolumeRampDuration(Number(e.target.value))}
                disabled={isLoading}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Volume will reach 100% after {volumeRampDuration} seconds
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-lg bg-black px-4 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          {isLoading ? (isEditMode ? "Updating..." : "Creating...") : isEditMode ? "Update Alarm" : "Create Alarm"}
        </button>
        {isEditMode && onEditCancel && (
          <button
            type="button"
            onClick={onEditCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
