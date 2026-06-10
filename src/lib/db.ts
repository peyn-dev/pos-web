import { openDB, type IDBPDatabase } from "idb";

let _db: IDBPDatabase | null = null;

export async function getDb(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB("pos-web-db", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "email" });
      }
      if (!db.objectStoreNames.contains("products")) {
        db.createObjectStore("products", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("adjustments")) {
        db.createObjectStore("adjustments", { keyPath: "id" });
      }
    },
  });
  return _db;
}
