import { openDB } from "idb";

export const dbPromise = openDB("auth-db", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("users")) {
      db.createObjectStore("users", {
        keyPath: "email",
      });
    }
  },
});
