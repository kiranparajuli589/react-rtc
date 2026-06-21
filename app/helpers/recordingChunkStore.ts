import Config from "@/config";

const DB_NAME = "capture-studio-chunks";
const DB_VERSION = 1;
const STORE_NAME = "chunks";

type ChunkRecord = {
  id: string;
  sessionId: string;
  index: number;
  blob: Blob;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("sessionId", "sessionId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = fn(store);
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

export function isChunkStoreAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

export async function appendChunkToStore(sessionId: string, index: number, blob: Blob): Promise<void> {
  if (!isChunkStoreAvailable()) return;
  await withStore("readwrite", (store) =>
    store.put({ id: `${sessionId}:${index}`, sessionId, index, blob } satisfies ChunkRecord),
  );
}

export async function readAllChunksFromStore(sessionId: string): Promise<Blob[]> {
  if (!isChunkStoreAvailable()) return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("sessionId");
    const request = index.getAll(sessionId);
    request.onsuccess = () => {
      const records = (request.result as ChunkRecord[]).sort((a, b) => a.index - b.index);
      resolve(records.map((r) => r.blob));
      db.close();
    };
    request.onerror = () => {
      reject(request.error);
      db.close();
    };
  });
}

export async function clearChunkSession(sessionId: string): Promise<void> {
  if (!isChunkStoreAvailable()) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("sessionId");
    const request = index.getAllKeys(sessionId);
    request.onsuccess = () => {
      const keys = request.result as string[];
      keys.forEach((key) => store.delete(key));
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export function getChunkSpillThresholdBytes(): number {
  return Config.CHUNK_SPILL_THRESHOLD_BYTES;
}
