import { openDB, type IDBPDatabase } from "idb";

let _db: IDBPDatabase | null = null;

export async function getDb(): Promise<IDBPDatabase> {
  if (_db) return _db;
  _db = await openDB("pos-web-db", 3, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore("users", { keyPath: "email" });
        db.createObjectStore("products", { keyPath: "id" });
        db.createObjectStore("adjustments", { keyPath: "id" });
      }
      if (oldVersion < 2) {
        db.createObjectStore("transactions", { keyPath: "id" });
      }
      if (oldVersion < 3) {
        db.deleteObjectStore("users");
        db.createObjectStore("users", { keyPath: "username" });
      }
    },
  });
  return _db;
}
