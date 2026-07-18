// IndexedDB wrapper for alarm storage

const DB_NAME = "AlarmDB";
const STORE_NAME = "alarms";
const DB_VERSION = 1;

interface StoredAlarm {
  id: string;
  name: string;
  soundData?: Blob;
  snoozeDuration: number;
  snoozeLimit: number | null;
  autoDismissDuration: number;
  createdAt: number;
  volumeRampEnabled?: boolean;
  startingVolume?: number;
  volumeRampDuration?: number;
}

// Helper to migrate legacy alarms containing snoozeOptions
function migrateAlarm(alarm: any): StoredAlarm {
  if (!alarm) return alarm;
  // Backfill legacy data and ensure defaults for new fields
  const migrated = {
    ...alarm,
    snoozeDuration:
      typeof alarm.snoozeDuration === "number"
        ? alarm.snoozeDuration
        : (alarm.snoozeOptions && alarm.snoozeOptions[0]) || 5,
    snoozeLimit: alarm.snoozeLimit !== undefined ? alarm.snoozeLimit : null,
    autoDismissDuration: typeof alarm.autoDismissDuration === "number" ? alarm.autoDismissDuration : 10,
  };

  return migrated;
}

let db: IDBDatabase | null = null;

// Initialize database
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

// Save alarm to IndexedDB
export async function saveAlarm(alarm: StoredAlarm): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(alarm);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Get alarm by ID
export async function getAlarm(id: string): Promise<StoredAlarm | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(migrateAlarm(request.result));
  });
}

// Get alarm by name
export async function getAlarmByName(name: string): Promise<StoredAlarm | undefined> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const results = request.result as any[];
      const found = results.find((alarm) => alarm.name === name);
      resolve(found ? migrateAlarm(found) : undefined);
    };
  });
}

// Get all alarms
export async function getAllAlarms(): Promise<StoredAlarm[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const results = request.result || [];
      resolve(results.map(migrateAlarm));
    };
  });
}

// Delete alarm by ID
export async function deleteAlarm(id: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Delete all alarms (for testing)
export async function deleteAllAlarms(): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
