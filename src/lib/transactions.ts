import { getDb } from "./db";

export interface TransactionItem {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  receiptId: string;
  items: TransactionItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  paymentMethod: "cash" | "card" | "split";
  cashTendered: number;
  change: number;
  status: "paid" | "refunded";
  createdAt: Date;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    const db = await getDb();
    const txns = await db.getAll("transactions");
    return txns.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error("Failed to load transactions:", err);
    return [];
  }
}

export async function addTransaction(
  transaction: Transaction
): Promise<void> {
  const db = await getDb();
  await db.add("transactions", transaction);
}

export async function seedTransactions(): Promise<void> {
  // no seed data
}
