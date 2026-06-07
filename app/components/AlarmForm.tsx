"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useAlarmStore } from "@/lib/store";
import { useRouter } from "next/navigation";

interface AlarmFormProps {
  onSuccess?: () => void;
}

export default function AlarmForm({ onSuccess }: AlarmFormProps) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [snoozeOptions, setSnoozeOptions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const addAlarm = useAlarmStore((state) => state.addAlarm);

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

  const handleSnoozeOptionChange = (duration: number) => {
    setSnoozeOptions((prev) =>
      prev.includes(duration) ? prev.filter((d) => d !== duration) : [...prev, duration].sort((a, b) => a - b),
    );
  };

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

      if (snoozeOptions.length === 0) {
        setError("Please select at least one snooze option");
        setIsLoading(false);
        return;
      }

      // Create alarm with optional sound
      const soundData = file ? new Blob([file], { type: file.type }) : undefined;

      await addAlarm({
        name: name.trim(),
        soundData,
        snoozeOptions,
      });

      // Reset form
      setName("");
      setFile(null);
      setSnoozeOptions([]);

      // Navigate to the alarm page
      router.push(`/alarm/${encodeURIComponent(name.trim())}`);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create alarm");
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

      {/* Snooze Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Snooze Options (minutes)
        </label>
        <div className="flex gap-3 flex-wrap">
          {[5, 10, 15, 20, 30].map((duration) => (
            <button
              key={duration}
              type="button"
              onClick={() => handleSnoozeOptionChange(duration)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                snoozeOptions.includes(duration)
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {duration}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200"
      >
        {isLoading ? "Creating..." : "Create Alarm"}
      </button>
    </form>
  );
}
