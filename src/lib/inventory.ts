import { getDb } from "./db";

export type UnitOfMeasure = "pcs" | "kg" | "box" | "liter" | "meter";

export interface Product {
  id: string;
  sku: string;
  title: string;
  unit: UnitOfMeasure;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  threshold: number;
  category: string;
}

export type AdjustmentReason = "damaged" | "discrepancy_theft" | "promo_display";

export interface Adjustment {
  id: string;
  productId: string;
  reason: AdjustmentReason;
  previousStock: number;
  newStock: number;
  notes: string;
  date: Date;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const db = await getDb();
    return await db.getAll("products");
  } catch (err) {
    console.error("Failed to load products from IndexedDB:", err);
    return [];
  }
}

export async function addProduct(product: Product): Promise<void> {
  const db = await getDb();
  await db.add("products", product);
}

export async function updateProductStock(id: string, newStock: number): Promise<void> {
  const db = await getDb();
  const product = await db.get("products", id);
  if (!product) return;
  product.stock = newStock;
  await db.put("products", product);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const db = await getDb();
  return db.get("products", id);
}

export async function getAllAdjustments(): Promise<Adjustment[]> {
  try {
    const db = await getDb();
    const adjustments = await db.getAll("adjustments");
    return adjustments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (err) {
    console.error("Failed to load adjustments from IndexedDB:", err);
    return [];
  }
}

export async function addAdjustment(adjustment: Adjustment): Promise<void> {
  const db = await getDb();
  await db.add("adjustments", adjustment);
}
