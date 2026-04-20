// ========================================
// 副本分层记忆系统 - IndexedDB
// L1: 原始日志（每轮快照）
// L3: 章节摘要
// ========================================

import type { NarrativeEntry } from "@/game/dungeon/types";

const DB_NAME = "dungeon-memory";
const DB_VERSION = 1;

interface RawLogEntry {
  id: string;
  moduleId: string;
  chapter: string;
  roundIndex: number;
  timestamp: number;
  narrativeHistory: NarrativeEntry[];
}

interface ChapterSummary {
  id: string;
  moduleId: string;
  chapter: string;
  summary: string;
  timestamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("rawLogs")) {
        const store = db.createObjectStore("rawLogs", { keyPath: "id" });
        store.createIndex("moduleId_chapter", ["moduleId", "chapter"], { unique: false });
      }
      if (!db.objectStoreNames.contains("chapterSummaries")) {
        const store = db.createObjectStore("chapterSummaries", { keyPath: "id" });
        store.createIndex("moduleId", "moduleId", { unique: false });
        store.createIndex("moduleId_chapter", ["moduleId", "chapter"], { unique: true });
      }
    };
  });
  return dbPromise;
}

// ------------------------------------------------------------------
// L1: 原始日志
// ------------------------------------------------------------------

export async function saveRawLog(
  moduleId: string,
  chapter: string,
  roundIndex: number,
  narrativeHistory: NarrativeEntry[]
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("rawLogs", "readwrite");
  const store = tx.objectStore("rawLogs");
  const entry: RawLogEntry = {
    id: `${moduleId}_${chapter}_${roundIndex}_${Date.now()}`,
    moduleId,
    chapter,
    roundIndex,
    timestamp: Date.now(),
    narrativeHistory,
  };
  store.put(entry);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getRawLogsByChapter(
  moduleId: string,
  chapter: string
): Promise<RawLogEntry[]> {
  const db = await openDB();
  const tx = db.transaction("rawLogs", "readonly");
  const store = tx.objectStore("rawLogs");
  const index = store.index("moduleId_chapter");
  const request = index.getAll([moduleId, chapter]);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as RawLogEntry[]);
    request.onerror = () => reject(request.error);
  });
}

export async function clearRawLogs(moduleId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("rawLogs", "readwrite");
  const store = tx.objectStore("rawLogs");
  const request = store.openCursor();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        const entry = cursor.value as RawLogEntry;
        if (entry.moduleId === moduleId) cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ------------------------------------------------------------------
// L3: 章节摘要
// ------------------------------------------------------------------

export async function saveChapterSummary(
  moduleId: string,
  chapter: string,
  summary: string
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("chapterSummaries", "readwrite");
  const store = tx.objectStore("chapterSummaries");
  const entry: ChapterSummary = {
    id: `${moduleId}_${chapter}`,
    moduleId,
    chapter,
    summary,
    timestamp: Date.now(),
  };
  store.put(entry);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getChapterSummaries(moduleId: string): Promise<ChapterSummary[]> {
  const db = await openDB();
  const tx = db.transaction("chapterSummaries", "readonly");
  const store = tx.objectStore("chapterSummaries");
  const index = store.index("moduleId");
  const request = index.getAll(moduleId);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const result = (request.result as ChapterSummary[]).sort(
        (a, b) => a.timestamp - b.timestamp
      );
      resolve(result);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearChapterSummaries(moduleId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("chapterSummaries", "readwrite");
  const store = tx.objectStore("chapterSummaries");
  const index = store.index("moduleId");
  const request = index.openCursor(moduleId);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ------------------------------------------------------------------
// 清理整个副本的记忆
// ------------------------------------------------------------------

export async function clearDungeonMemory(moduleId: string): Promise<void> {
  await Promise.all([clearRawLogs(moduleId), clearChapterSummaries(moduleId)]);
}
