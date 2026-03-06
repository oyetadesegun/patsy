export interface OfflineImage {
  id: string;
  blob: Blob;
  fileName: string;
  status: "pending" | "uploading" | "failed" | "completed";
  url?: string;
  createdAt: number;
}

export interface OfflineOperation {
  id: string;
  type: "add" | "update" | "delete";
  itemId?: string;
  data: any;
  status: "pending" | "processing" | "failed" | "completed";
  createdAt: number;
}

const DB_NAME = "patsy-offline-db";
const IMAGE_STORE = "image-uploads";
const OP_STORE = "inventory-operations";
const DB_VERSION = 2;

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(OP_STORE)) {
        db.createObjectStore(OP_STORE, { keyPath: "id" });
      }
    };
  });
}

export async function saveOfflineImage(image: OfflineImage): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE, "readwrite");
    const store = transaction.objectStore(IMAGE_STORE);
    const request = store.add(image);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateOfflineImage(image: OfflineImage): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE, "readwrite");
    const store = transaction.objectStore(IMAGE_STORE);
    const request = store.put(image);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineImages(): Promise<OfflineImage[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE, "readonly");
    const store = transaction.objectStore(IMAGE_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteOfflineImage(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE, "readwrite");
    const store = transaction.objectStore(IMAGE_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Inventory Operations
export async function saveOfflineOperation(
  op: OfflineOperation,
): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OP_STORE, "readwrite");
    const store = transaction.objectStore(OP_STORE);
    const request = store.add(op);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateOfflineOperation(
  op: OfflineOperation,
): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OP_STORE, "readwrite");
    const store = transaction.objectStore(OP_STORE);
    const request = store.put(op);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineOperations(): Promise<OfflineOperation[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OP_STORE, "readonly");
    const store = transaction.objectStore(OP_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteOfflineOperation(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OP_STORE, "readwrite");
    const store = transaction.objectStore(OP_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
