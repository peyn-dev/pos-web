import bcrypt from "bcryptjs";
import { dbPromise } from "./db";

export async function registerUser(email: string, password: string) {
  const db = await dbPromise;

  const existing = await db.get("users", email);
  if (existing) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.put("users", {
    email,
    passwordHash,
  });
}

export async function loginUser(email: string, password: string) {
  const db = await dbPromise;
  const user = await db.get("users", email);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  // session
  localStorage.setItem(
    "session",
    JSON.stringify({ email })
  );
}

export function logoutUser() {
  localStorage.removeItem("session");
}

export function getSession() {
  const session = localStorage.getItem("session");
  return session ? JSON.parse(session) : null;
}
