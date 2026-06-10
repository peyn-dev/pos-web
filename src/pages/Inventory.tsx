import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertTriangle,
  Plus,
  Package,
  TrendingDown,
  ClipboardList,
  Loader2,
} from "lucide-react"
import type { Product, Adjustment, UnitOfMeasure, AdjustmentReason } from "@/lib/inventory"
import {
  getAllProducts,
  addProduct,
  updateProductStock,
  getAllAdjustments,
  addAdjustment,
  generateId,
} from "@/lib/inventory"

function stockStatus(stock: number, threshold: number): { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string } {
  if (stock === 0) return { label: "Out of Stock", variant: "destructive", className: "" }
  if (stock <= threshold) return { label: "Low Stock", variant: "secondary", className: "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700" }
  return { label: "In Stock", variant: "default", className: "bg-green-100 text-green-800 border-green-300 hover:bg-green-100 dark:bg-green-900/60 dark:text-green-300 dark:border-green-700" }
}

const reasonOptions = [
  { value: "damaged" as AdjustmentReason, label: "Damaged" },
  { value: "discrepancy_theft" as AdjustmentReason, label: "Discrepancy / Theft" },
  { value: "promo_display" as AdjustmentReason, label: "Promo / Display" },
]

const unitOptions: { value: UnitOfMeasure; label: string }[] = [
  { value: "pcs", label: "Pieces" },
  { value: "kg", label: "Kilograms" },
  { value: "box", label: "Box" },
  { value: "liter", label: "Liters" },
  { value: "meter", label: "Meters" },
]

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    sku: "",
    title: "",
    unit: "pcs" as UnitOfMeasure,
    costPrice: "",
    sellingPrice: "",
    stock: "",
    threshold: "",
  })

  const [adjustForm, setAdjustForm] = useState({
    newStock: "",
    reason: "damaged" as AdjustmentReason,
    notes: "",
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    const [loadedProducts, loadedAdjustments] = await Promise.all([
      getAllProducts(),
      getAllAdjustments(),
    ])
    setProducts(loadedProducts)
    setAdjustments(loadedAdjustments)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function resetForm() {
    setForm({ sku: "", title: "", unit: "pcs", costPrice: "", sellingPrice: "", stock: "", threshold: "" })
  }

  function resetAdjustForm() {
    setAdjustForm({ newStock: "", reason: "damaged", notes: "" })
  }

  async function handleAddProduct() {
    setSaving(true)
    const product: Product = {
      id: generateId(),
      sku: form.sku,
      title: form.title,
      unit: form.unit,
      costPrice: parseFloat(form.costPrice) || 0,
      sellingPrice: parseFloat(form.sellingPrice) || 0,
      stock: parseInt(form.stock) || 0,
      threshold: parseInt(form.threshold) || 0,
    }
    await addProduct(product)
    setProducts((prev) => [...prev, product])
    resetForm()
    setAddOpen(false)
    setSaving(false)
  }

  async function handleAdjustStock() {
    if (!adjustTarget) return
    const newStock = parseInt(adjustForm.newStock)
    if (isNaN(newStock)) return

    setSaving(true)
    const adjustment: Adjustment = {
      id: generateId(),
      productId: adjustTarget.id,
      reason: adjustForm.reason,
      previousStock: adjustTarget.stock,
      newStock,
      notes: adjustForm.notes,
      date: new Date(),
    }

    await Promise.all([
      updateProductStock(adjustTarget.id, newStock),
      addAdjustment(adjustment),
    ])

    setProducts((prev) =>
      prev.map((p) => (p.id === adjustTarget.id ? { ...p, stock: newStock } : p))
    )
    setAdjustments((prev) => [adjustment, ...prev])
    resetAdjustForm()
    setAdjustOpen(false)
    setAdjustTarget(null)
    setSaving(false)
  }

  function openAdjustDialog(product: Product) {
    setAdjustTarget(product)
    setAdjustForm({ newStock: String(product.stock), reason: "damaged", notes: "" })
    setAdjustOpen(true)
  }

  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= p.threshold)
  const outOfStockProducts = products.filter((p) => p.stock === 0)
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
        <p className="text-sm text-muted-foreground">Manage products, stock levels, and adjustments.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Loading inventory...
        </div>
      ) : (
        <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="size-4" />
            Total Products
          </div>
          <p className="mt-1 text-2xl font-bold">{products.length}</p>
        </div>
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="size-4" />
            Low Stock Items
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{lowStockProducts.length}</p>
        </div>
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="size-4" />
            Out of Stock
          </div>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{outOfStockProducts.length}</p>
        </div>
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardList className="size-4" />
            Stock Value
          </div>
          <p className="mt-1 text-2xl font-bold">${totalValue.toFixed(2)}</p>
        </div>
      </div>

      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/50">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            <span className="font-semibold text-amber-800 dark:text-amber-200">Low Stock & Sourcing Alerts</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[...outOfStockProducts, ...lowStockProducts].map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border border-amber-200 bg-white px-3 py-2 text-sm dark:border-amber-800 dark:bg-zinc-900">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.sku}</p>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <p className={`font-semibold ${p.stock === 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {p.stock} {p.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">min {p.threshold}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">All Products</h3>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 size-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
              <DialogDescription>Enter the details for the new inventory item.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Barcode</Label>
                  <Input id="sku" placeholder="e.g. SKU-006" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit of Measure</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v as UnitOfMeasure }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Product Title</Label>
                <Input id="title" placeholder="e.g. Organic Honey 500g" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price ($)</Label>
                  <Input id="costPrice" type="number" step="0.01" min="0" placeholder="0.00" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Selling Price ($)</Label>
                  <Input id="sellingPrice" type="number" step="0.01" min="0" placeholder="0.00" value={form.sellingPrice} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Initial Stock</Label>
                  <Input id="stock" type="number" min="0" placeholder="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="threshold">Alert Threshold</Label>
                  <Input id="threshold" type="number" min="0" placeholder="0" value={form.threshold} onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { resetForm(); setAddOpen(false) }}>Cancel</Button>
              <Button onClick={handleAddProduct} disabled={!form.sku || !form.title}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU / Barcode</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead className="text-right">Cost Price</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No products yet. Click "Add Product" to get started.
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => {
              const status = stockStatus(product.stock, product.threshold)
              return (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell className="text-right">${product.costPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${product.sellingPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className={status.className}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="xs" onClick={() => openAdjustDialog(product)}>
                      Adjust
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={adjustOpen} onOpenChange={(v) => { setAdjustOpen(v); if (!v) setAdjustTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Stock Adjustment</DialogTitle>
            <DialogDescription>
              {adjustTarget ? `Log a manual cycle count for "${adjustTarget.title}".` : ""}
            </DialogDescription>
          </DialogHeader>
          {adjustTarget && (
            <div className="grid gap-4 py-4">
              <div className="rounded-md bg-muted px-3 py-2 text-sm">
                <span className="text-muted-foreground">Current stock: </span>
                <span className="font-semibold">{adjustTarget.stock} {adjustTarget.unit}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newStock">New Stock Count</Label>
                <Input id="newStock" type="number" min="0" placeholder="0" value={adjustForm.newStock} onChange={(e) => setAdjustForm((f) => ({ ...f, newStock: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Select value={adjustForm.reason} onValueChange={(v) => setAdjustForm((f) => ({ ...f, reason: v as Adjustment["reason"] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reasonOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input id="notes" placeholder="e.g. Found 2 damaged units" value={adjustForm.notes} onChange={(e) => setAdjustForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAdjustOpen(false); setAdjustTarget(null) }}>Cancel</Button>
            <Button onClick={handleAdjustStock}>Save Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {adjustments.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold">Recent Adjustments</h3>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-right">New</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => {
                  const product = products.find((p) => p.id === adj.productId)
                  const reasonLabel = reasonOptions.find((r) => r.value === adj.reason)?.label ?? adj.reason
                  return (
                    <TableRow key={adj.id}>
                      <TableCell className="font-medium">{product?.title ?? "Unknown"}</TableCell>
                      <TableCell className="text-right">{adj.previousStock}</TableCell>
                      <TableCell className="text-right font-semibold">{adj.newStock}</TableCell>
                      <TableCell>{reasonLabel}</TableCell>
                      <TableCell className="text-muted-foreground">{adj.notes || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{adj.date.toLocaleDateString()}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
