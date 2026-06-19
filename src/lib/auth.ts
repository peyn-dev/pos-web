import bcrypt from "bcryptjs";
import { getDb } from "./db";

export interface AppUser {
  username: string;
  passwordHash: string;
  role: "Administrator" | "cashier";
  createdAt: Date;
}

export async function registerUser(
  username: string,
  password: string,
  role: "Administrator" | "cashier" = "cashier"
) {
  const db = await getDb();

  const existing = await db.get("users", username);
  if (existing) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.put("users", {
    username,
    passwordHash,
    role,
    createdAt: new Date(),
  });
}

export async function loginUser(username: string, password: string) {
  const db = await getDb();
  const user: AppUser | undefined = await db.get("users", username);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  localStorage.setItem(
    "session",
    JSON.stringify({ username, role: user.role })
  );
}

export async function seedDefaultUser(): Promise<void> {
  const db = await getDb();
  const existing = await db.get("users", "admin");
  if (existing) return;
  const passwordHash = await bcrypt.hash("123", 10);
  await db.put("users", {
    username: "admin",
    passwordHash,
    role: "Administrator",
    createdAt: new Date(),
  });
}

export async function getAllUsers(): Promise<AppUser[]> {
  const db = await getDb();
  const users: AppUser[] = await db.getAll("users");
  return users.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function logoutUser() {
  localStorage.removeItem("session");
}

export function getSession(): { username: string; role: string } | null {
  const session = localStorage.getItem("session");
  if (!session) return null;
  const parsed = JSON.parse(session);
  if (parsed.role === "admin") parsed.role = "Administrator";
  return parsed;
}
