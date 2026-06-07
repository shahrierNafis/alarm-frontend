"use client";

import { useEffect, useState } from "react";

interface SnoozeTimerProps {
  isActive: boolean;
  remainingMs: number;
}

export default function SnoozeTimer({ isActive, remainingMs }: SnoozeTimerProps) {
  const [displayTime, setDisplayTime] = useState<string>("");

  useEffect(() => {
    const updateDisplay = () => {
      const totalSeconds = Math.ceil(remainingMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setDisplayTime(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    };

    updateDisplay();

    // Update every 100ms for smooth countdown
    const interval = setInterval(updateDisplay, 100);

    return () => clearInterval(interval);
  }, [remainingMs]);

  if (!isActive) return null;

  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Snooze Time Remaining</p>
      <div className="text-6xl font-bold text-black dark:text-white font-mono">{displayTime || "00:00"}</div>
    </div>
  );
}
