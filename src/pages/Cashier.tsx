import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { getAllProducts, getProduct, updateProductStock } from "@/lib/inventory"
import type { Product } from "@/lib/inventory"
import {
  Search,
  Scan,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Percent,
  Banknote,
  CreditCard,
 Split,
  Receipt,
} from "lucide-react"

interface CatalogItem {
  id: string
  sku: string
  name: string
  price: number
  category: string
}

interface CartItem {
  productId: string
  sku: string
  name: string
  unitPrice: number
  quantity: number
}

const PAYMENT_BUTTONS = [20, 50, 100, 500]

export default function Cashier() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [catalogLoading, setCatalogLoading] = useState(true)

  const categories = useMemo(() => {
    const cats = new Set(catalog.map((p) => p.category))
    return ["All", ...Array.from(cats).sort()]
  }, [catalog])

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    const products = await getAllProducts()
    setCatalog(
      products.map((p: Product) => ({
        id: p.id,
        sku: p.sku,
        name: p.title,
        price: p.sellingPrice,
        category: p.category || "General",
      }))
    )
    setCatalogLoading(false)
  }, [])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "split">("cash")
  const [cashTendered, setCashTendered] = useState(0)
  const [completed, setCompleted] = useState(false)

  const filteredProducts = useMemo(() => {
    return catalog.filter((item) => {
      const matchCategory = category === "All" || item.category === category
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
      return matchCategory && matchSearch
    })
  }, [category, search])

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  )

  const discountAmount = useMemo(
    () => (discountPercent > 0 ? subtotal * (discountPercent / 100) : 0),
    [subtotal, discountPercent]
  )

  const total = subtotal - discountAmount
  const change = cashTendered - total

  function addToCart(item: CatalogItem) {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.productId === item.id)
      if (existing) {
        return prev.map((ci) =>
          ci.productId === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        )
      }
      return [
        ...prev,
        {
          productId: item.id,
          sku: item.sku,
          name: item.name,
          unitPrice: item.price,
          quantity: 1,
        },
      ]
    })
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((ci) =>
          ci.productId === productId ? { ...ci, quantity: Math.max(0, ci.quantity + delta) } : ci
        )
        .filter((ci) => ci.quantity > 0)
    )
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((ci) => ci.productId !== productId))
  }

  function applyDiscount() {
    setDiscountOpen(false)
  }

  function handleCashQuick(amount: number) {
    setCashTendered((prev) => +((prev * 100 + amount * 100) / 100).toFixed(2))
  }

  function handleExactChange() {
    setCashTendered(total)
  }

  async function handleComplete() {
    const blocked: string[] = []
    const depleted: string[] = []
    for (const item of cart) {
      const product = await getProduct(item.productId)
      if (!product || product.stock === 0) {
        blocked.push(item.name)
      }
    }
    if (blocked.length > 0) {
      for (const name of blocked) {
        toast.error(`${name} is out of stock and cannot be purchased`)
      }
      return
    }
    for (const item of cart) {
      const product = await getProduct(item.productId)
      if (product) {
        const newStock = product.stock - item.quantity
        await updateProductStock(item.productId, newStock)
        if (newStock === 0) {
          depleted.push(product.title)
        }
      }
    }
    if (depleted.length > 0) {
      for (const name of depleted) {
        toast.warning(`${name} is now out of stock`)
      }
    }
    setCompleted(true)
  }

  function resetAll() {
    setCart([])
    setDiscountPercent(0)
    setCashTendered(0)
    setPaymentMethod("cash")
    setCompleted(false)
    setCheckoutOpen(false)
  }

  const itemCount = cart.reduce((sum, ci) => sum + ci.quantity, 0)

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] -m-4 sm:-m-6">
      <div className="flex w-8/12 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or scan barcode..."
              className="pl-9 pr-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <Scan className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Tabs value={category} onValueChange={(v) => setCategory(v)}>
            <TabsList className="w-full">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="flex-1">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {catalogLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
              {search ? "No products match your search." : "No products available. Add products in Inventory first."}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-3 text-center transition-all hover:border-zinc-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="flex size-12 items-center justify-center rounded-lg bg-zinc-100 text-lg font-bold text-muted-foreground dark:bg-zinc-800">
                    {product.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                  <Badge variant="default" className="font-semibold">
                    ₱{product.price.toFixed(2)}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex w-4/12 flex-col bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <ShoppingCart className="size-4" />
          <span className="font-semibold">Current Order</span>
          {itemCount > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
              <div>
                <ShoppingCart className="mx-auto mb-2 size-8 opacity-30" />
                Tap a product to add it to the order.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">₱{item.unitPrice.toFixed(2)} ea</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="xs"
                      className="size-7 p-0"
                      onClick={() => updateQuantity(item.productId, -1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="flex size-8 items-center justify-center text-sm font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="xs"
                      className="size-7 p-0"
                      onClick={() => updateQuantity(item.productId, 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <p className="w-16 text-right text-sm font-semibold tabular-nums">
                    ₱{(item.unitPrice * item.quantity).toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="size-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">₱{subtotal.toFixed(2)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount ({discountPercent}%)</span>
                <span className="tabular-nums">-₱{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="xs"
                className="gap-1"
                onClick={() => setDiscountOpen(true)}
              >
                <Percent className="size-3" />
                Discount
              </Button>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-xl font-bold tabular-nums">₱{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Button
            className="mt-4 w-full h-12 text-base font-semibold"
            disabled={cart.length === 0}
            onClick={() => {
              setCashTendered(0)
              setPaymentMethod("cash")
              setCompleted(false)
              setCheckoutOpen(true)
            }}
          >
            <Banknote className="mr-2 size-5" />
            Pay ₱{total.toFixed(2)}
          </Button>
        </div>
      </div>

      <Dialog
        open={discountOpen}
        onOpenChange={(v) => {
          setDiscountOpen(v)
          if (!v && discountPercent === 0) setDiscountPercent(0)
        }}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>Enter a percentage discount for this order.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="0%"
              value={discountPercent || ""}
              onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
            />
            {discountPercent > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                -₱{discountAmount.toFixed(2)} off
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDiscountPercent(0); setDiscountOpen(false) }}>
              Remove
            </Button>
            <Button onClick={() => setDiscountOpen(false)}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={checkoutOpen}
        onOpenChange={(v) => {
          if (!v && !completed) setCheckoutOpen(false)
        }}
      >
        <DialogContent className="sm:max-w-md">
          {completed ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-center">
                  <Receipt className="size-5" />
                  Transaction Complete
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-4 text-center">
                <div className="rounded-xl bg-green-50 p-4 dark:bg-green-950/30">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    ₱{total.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Charged</p>
                </div>
                {paymentMethod === "cash" && change >= 0 && (
                  <div className="rounded-lg border p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tendered</span>
                      <span className="font-semibold">₱{cashTendered.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Change</span>
                      <span className="font-semibold text-emerald-600">₱{change.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Payment: {paymentMethod === "cash" ? "Cash" : paymentMethod === "card" ? "Card" : "Split Pay"}
                </p>
              </div>
              <DialogFooter>
                <Button className="w-full" onClick={resetAll}>
                  New Order
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Complete Payment</DialogTitle>
                <DialogDescription>
                  Total due: <span className="font-bold">₱{total.toFixed(2)}</span>
                </DialogDescription>
              </DialogHeader>

              <Tabs
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as "cash" | "card" | "split")}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="cash" className="flex-1 gap-1.5">
                    <Banknote className="size-4" />
                    Cash
                  </TabsTrigger>
                  <TabsTrigger value="card" className="flex-1 gap-1.5">
                    <CreditCard className="size-4" />
                    Card
                  </TabsTrigger>
                  <TabsTrigger value="split" className="flex-1 gap-1.5">
                    <Split className="size-4" />
                    Split
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="py-2">
                {paymentMethod === "cash" && (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount Due</span>
                        <span className="font-bold">₱{total.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-muted-foreground">Tendered</span>
                        <span className="font-semibold text-lg">₱{cashTendered.toFixed(2)}</span>
                      </div>
                      {cashTendered >= total && (
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-muted-foreground">Change</span>
                          <span className="font-semibold text-emerald-600">₱{change.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {PAYMENT_BUTTONS.map((amt) => (
                        <Button key={amt} variant="outline" onClick={() => handleCashQuick(amt)}>
                          +₱{amt}
                        </Button>
                      ))}
                      <Button variant="outline" onClick={handleExactChange}>
                        Exact
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCashTendered(0)}
                        disabled={cashTendered === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                    <CreditCard className="mx-auto mb-2 size-8" />
                    <p>Swipe, tap, or insert card to process payment.</p>
                    <p className="mt-1 text-xs">Amount: ₱{total.toFixed(2)}</p>
                  </div>
                )}

                {paymentMethod === "split" && (
                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      Split payment configuration coming soon. Select Cash or Card for now.
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  className="w-full h-12 text-base"
                  disabled={paymentMethod === "cash" && cashTendered < total}
                  onClick={handleComplete}
                >
                  <Receipt className="mr-2 size-5" />
                  Complete Transaction
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setCheckoutOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
