"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAlarmStore } from "@/lib/store";
import { Alarm } from "@/lib/types";

interface AlarmListProps {
  onEditAlarm?: (alarm: Alarm) => void;
}

export default function AlarmList({ onEditAlarm }: AlarmListProps) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { alarms: storeAlarms, loadAlarms, deleteAlarm } = useAlarmStore();

  useEffect(() => {
    const initializeAlarms = async () => {
      setIsLoading(true);
      await loadAlarms();
      setIsLoading(false);
    };
    initializeAlarms();
  }, [loadAlarms]);

  useEffect(() => {
    setAlarms(storeAlarms);
  }, [storeAlarms]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this alarm?")) {
      await deleteAlarm(id);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading alarms...</p>
      </div>
    );
  }

  if (alarms.length === 0) {
    return (
      <div className="w-full max-w-2xl text-center">
        <p className="text-gray-600 dark:text-gray-400">No alarms yet. Create your first alarm above!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Alarms</h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {alarms.map((alarm) => (
          <div
            key={alarm.id}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">{alarm.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Snooze: {alarm.snoozeDuration} min ({alarm.snoozeLimit === null || alarm.snoozeLimit === undefined ? "Unlimited" : `Max ${alarm.snoozeLimit}x`})
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Sound: {alarm.soundData ? "Custom" : "Default"}
            </p>
            <div className="flex gap-2 mt-4">
              <Link
                href={`/alarm/${encodeURIComponent(alarm.name)}`}
                className="flex-1 rounded-lg bg-black px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Open
              </Link>
              <button
                onClick={() => onEditAlarm?.(alarm)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(alarm.id)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
