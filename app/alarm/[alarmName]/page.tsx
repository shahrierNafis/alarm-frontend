"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAlarmStore } from "@/lib/store";
import { Alarm } from "@/lib/types";
import DigitalClock from "@/app/components/DigitalClock";
import AlarmPlayer from "@/app/components/AlarmPlayer";

export default function AlarmPage() {
  const params = useParams();
  const router = useRouter();
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { loadAlarms, getAlarmByName } = useAlarmStore();

  useEffect(() => {
    const initializeAlarm = async () => {
      try {
        setIsLoading(true);
        await loadAlarms();

        const alarmName = decodeURIComponent(params.alarmName as string);
        const foundAlarm = getAlarmByName(alarmName);

        if (!foundAlarm) {
          setError("Alarm not found");
          return;
        }

        setAlarm(foundAlarm);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load alarm");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.alarmName) {
      initializeAlarm();
    }
  }, [params.alarmName, loadAlarms, getAlarmByName]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-lg text-gray-600 dark:text-gray-400">Loading alarm...</p>
      </div>
    );
  }

  if (error || !alarm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black gap-4">
        <p className="text-lg text-red-600 dark:text-red-400">{error || "Alarm not found"}</p>
        <Link
          href="/configure"
          className="px-6 py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          Go to Configure
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black px-4 py-8">
      {/* Header with alarm name */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
        <Link
          href="/"
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          ← Home
        </Link>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center gap-12 w-full max-w-2xl flex-1">
        {/* Alarm Title */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">{alarm.name}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Alarm is active</p>
        </div>

        {/* Digital Clock */}
        <div className="text-center">
          <DigitalClock />
        </div>

        {/* Alarm Player Controls */}
        <div className="w-full">
          <AlarmPlayer alarm={alarm} />
        </div>
      </div>
    </div>
  );
}
