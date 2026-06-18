import bcrypt from "bcryptjs";
import { getDb } from "./db";

export interface AppUser {
  email: string;
  passwordHash: string;
  role: "admin" | "cashier";
  createdAt: Date;
}

export async function registerUser(
  email: string,
  password: string,
  role: "admin" | "cashier" = "cashier"
) {
  const db = await getDb();

  const existing = await db.get("users", email);
  if (existing) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.put("users", {
    email,
    passwordHash,
    role,
    createdAt: new Date(),
  });
}

export async function loginUser(email: string, password: string) {
  const db = await getDb();
  const user: AppUser | undefined = await db.get("users", email);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  localStorage.setItem(
    "session",
    JSON.stringify({ email, role: user.role })
  );
}

export async function getAllUsers(): Promise<AppUser[]> {
  const db = await getDb();
  const users: AppUser[] = await db.getAll("users");
  return users.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function logoutUser() {
  localStorage.removeItem("session");
}

export function getSession(): { email: string; role: string } | null {
  const session = localStorage.getItem("session");
  return session ? JSON.parse(session) : null;
}
