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
  const db = await getDb();
  const count = await db.count("transactions");
  if (count > 0) return;

  const now = Date.now();
  const seed: Transaction[] = [
    {
      id: generateId(),
      receiptId: "RCP-0001",
      items: [
        { productId: "p1", name: "Mineral Water 500ml", sku: "BEV-001", unitPrice: 15, quantity: 2 },
        { productId: "p2", name: "Organic Honey 500g", sku: "FOO-002", unitPrice: 120, quantity: 1 },
        { productId: "p3", name: "Notebook A5", sku: "STA-003", unitPrice: 45, quantity: 3 },
      ],
      subtotal: 285,
      discountPercent: 0,
      discountAmount: 0,
      total: 285,
      paymentMethod: "cash",
      cashTendered: 500,
      change: 215,
      status: "paid",
      createdAt: new Date(now - 3600000),
    },
    {
      id: generateId(),
      receiptId: "RCP-0002",
      items: [
        { productId: "p4", name: "Pasta 1kg", sku: "FOO-004", unitPrice: 85, quantity: 1 },
        { productId: "p5", name: "Green Tea", sku: "BEV-005", unitPrice: 25, quantity: 4 },
      ],
      subtotal: 185,
      discountPercent: 10,
      discountAmount: 18.5,
      total: 166.5,
      paymentMethod: "card",
      cashTendered: 166.5,
      change: 0,
      status: "paid",
      createdAt: new Date(now - 7200000),
    },
    {
      id: generateId(),
      receiptId: "RCP-0003",
      items: [
        { productId: "p1", name: "Mineral Water 500ml", sku: "BEV-001", unitPrice: 15, quantity: 12 },
      ],
      subtotal: 180,
      discountPercent: 0,
      discountAmount: 0,
      total: 180,
      paymentMethod: "cash",
      cashTendered: 200,
      change: 20,
      status: "refunded",
      createdAt: new Date(now - 86400000),
    },
    {
      id: generateId(),
      receiptId: "RCP-0004",
      items: [
        { productId: "p2", name: "Organic Honey 500g", sku: "FOO-002", unitPrice: 120, quantity: 1 },
        { productId: "p5", name: "Green Tea", sku: "BEV-005", unitPrice: 25, quantity: 2 },
        { productId: "p3", name: "Notebook A5", sku: "STA-003", unitPrice: 45, quantity: 1 },
      ],
      subtotal: 215,
      discountPercent: 5,
      discountAmount: 10.75,
      total: 204.25,
      paymentMethod: "split",
      cashTendered: 204.25,
      change: 0,
      status: "paid",
      createdAt: new Date(now - 172800000),
    },
    {
      id: generateId(),
      receiptId: "RCP-0005",
      items: [
        { productId: "p4", name: "Pasta 1kg", sku: "FOO-004", unitPrice: 85, quantity: 5 },
      ],
      subtotal: 425,
      discountPercent: 0,
      discountAmount: 0,
      total: 425,
      paymentMethod: "cash",
      cashTendered: 500,
      change: 75,
      status: "paid",
      createdAt: new Date(now - 259200000),
    },
    {
      id: generateId(),
      receiptId: "RCP-0006",
      items: [
        { productId: "p1", name: "Mineral Water 500ml", sku: "BEV-001", unitPrice: 15, quantity: 6 },
        { productId: "p4", name: "Pasta 1kg", sku: "FOO-004", unitPrice: 85, quantity: 2 },
        { productId: "p2", name: "Organic Honey 500g", sku: "FOO-002", unitPrice: 120, quantity: 1 },
      ],
      subtotal: 380,
      discountPercent: 0,
      discountAmount: 0,
      total: 380,
      paymentMethod: "card",
      cashTendered: 380,
      change: 0,
      status: "refunded",
      createdAt: new Date(now - 345600000),
    },
  ];

  const tx = db.transaction("transactions", "readwrite");
  for (const txn of seed) {
    await tx.store.add(txn);
  }
  await tx.done;
}
