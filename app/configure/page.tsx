"use client";

import Link from "next/link";
import AlarmForm from "@/app/components/AlarmForm";
import AlarmList from "@/app/components/AlarmList";
import { useEffect, useState } from "react";
import { useAlarmStore } from "@/lib/store";
import { Alarm } from "@/lib/types";

export default function ConfigurePage() {
  const loadAlarms = useAlarmStore((state) => state.loadAlarms);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);

  useEffect(() => {
    loadAlarms();
  }, [loadAlarms]);

  const handleEditSuccess = () => {
    setEditingAlarm(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">⏰ Configure Alarms</h1>
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto p-4 sm:p-24">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full">
          {/* Form Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 grid columns-1 justify-center">
            <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
              {editingAlarm ? "✏️ Edit Alarm" : "Create New Alarm"}
            </h2>
            <AlarmForm
              alarm={editingAlarm || undefined}
              onSuccess={handleEditSuccess}
              onEditCancel={() => setEditingAlarm(null)}
            />
          </div>

          {/* List Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <AlarmList onEditAlarm={setEditingAlarm} />
          </div>
        </div>
      </main>
    </div>
  );
}
