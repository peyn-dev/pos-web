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

const defaultProducts: Product[] = [
  { id: "1", sku: "SKU-001", title: "Premium Coffee Beans 250g", unit: "pcs", costPrice: 4.50, sellingPrice: 8.99, stock: 3, threshold: 10, category: "Food" },
  { id: "2", sku: "SKU-002", title: "Organic Green Tea 20 bags", unit: "box", costPrice: 2.20, sellingPrice: 5.49, stock: 25, threshold: 10, category: "Beverage" },
  { id: "3", sku: "SKU-003", title: "Dark Chocolate 100g", unit: "pcs", costPrice: 1.80, sellingPrice: 3.99, stock: 0, threshold: 15, category: "Food" },
  { id: "4", sku: "SKU-004", title: "Almond Milk 1L", unit: "liter", costPrice: 1.50, sellingPrice: 3.49, stock: 12, threshold: 8, category: "Beverage" },
  { id: "5", sku: "SKU-005", title: "Granola 500g", unit: "pcs", costPrice: 3.00, sellingPrice: 6.99, stock: 8, threshold: 10, category: "Food" },
];

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const db = await getDb();
    const products = await db.getAll("products");
    if (products.length === 0) {
      const tx = db.transaction("products", "readwrite");
      for (const p of defaultProducts) {
        await tx.store.add(p);
      }
      await tx.done;
      return defaultProducts;
    }
    return products;
  } catch (err) {
    console.error("Failed to load products from IndexedDB:", err);
    return defaultProducts;
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
