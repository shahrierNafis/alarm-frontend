// Zustand store for alarm management

import { create } from "zustand";
import * as db from "./db";
import { Alarm, AlarmState } from "./types";

export const useAlarmStore = create<AlarmState>((set, get) => ({
  alarms: [],

  // Load alarms from IndexedDB on initialization
  loadAlarms: async () => {
    try {
      const alarms = await db.getAllAlarms();
      set({ alarms });
    } catch (error) {
      console.error("Failed to load alarms:", error);
    }
  },

  // Add new alarm
  addAlarm: async (alarmData) => {
    try {
      const newAlarm: Alarm = {
        id: `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...alarmData,
        createdAt: Date.now(),
      };

      await db.saveAlarm(newAlarm);
      set((state) => ({
        alarms: [...state.alarms, newAlarm],
      }));
    } catch (error) {
      console.error("Failed to add alarm:", error);
      throw error;
    }
  },

  // Update existing alarm
  updateAlarm: async (id, alarmData) => {
    try {
      const existing = await db.getAlarm(id);
      if (!existing) throw new Error("Alarm not found");

      const updated: Alarm = {
        ...existing,
        ...alarmData,
        id, // keep the same ID
        createdAt: existing.createdAt, // keep original creation time
      };

      await db.saveAlarm(updated);
      set((state) => ({
        alarms: state.alarms.map((alarm) => (alarm.id === id ? updated : alarm)),
      }));
    } catch (error) {
      console.error("Failed to update alarm:", error);
      throw error;
    }
  },

  // Delete alarm
  deleteAlarm: async (id) => {
    try {
      await db.deleteAlarm(id);
      set((state) => ({
        alarms: state.alarms.filter((alarm) => alarm.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete alarm:", error);
      throw error;
    }
  },

  // Get alarm by name (exact match)
  getAlarmByName: (name: string) => {
    const { alarms } = get();
    return alarms.find((alarm) => alarm.name === name);
  },
}));
