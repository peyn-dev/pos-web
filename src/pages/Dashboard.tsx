import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, ShoppingCart, AlertTriangle, Banknote, Plus, Package, Receipt } from "lucide-react"
import { getAllTransactions } from "@/lib/transactions"
import type { Transaction } from "@/lib/transactions"
import { getAllProducts } from "@/lib/inventory"
import type { Product } from "@/lib/inventory"

function isToday(d: Date) {
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

const todayTxns = (txns: Transaction[]) =>
  txns.filter((t) => t.status !== "refunded" && isToday(new Date(t.createdAt)))

const hourlyBuckets = (txns: Transaction[]) => {
  const buckets = new Array(24).fill(0)
  for (const t of txns) {
    const h = new Date(t.createdAt).getHours()
    buckets[h] += t.total
  }
  return buckets.map((revenue, hour) => ({
    label: `${hour}:00`,
    revenue,
  }))
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [txns, prods] = await Promise.all([
        getAllTransactions(),
        getAllProducts(),
      ])
      setTransactions(txns)
      setProducts(prods)
      setLoading(false)
    }
    load()
  }, [])

  const today = useMemo(() => todayTxns(transactions), [transactions])

  const todayRevenue = useMemo(
    () => today.reduce((s, t) => s + t.total, 0),
    [today]
  )

  const todayCount = today.length

  const outOfStock = useMemo(
    () => products.filter((p) => p.stock === 0),
    [products]
  )
  const lowStock = useMemo(
    () => products.filter((p) => p.stock > 0 && p.stock <= p.threshold),
    [products]
  )
  const urgentCount = outOfStock.length + lowStock.length

  const cashInDrawer = useMemo(() => {
    let cash = 0
    for (const t of today) {
      if (t.paymentMethod === "cash") {
        cash += t.cashTendered - t.change
      }
    }
    return cash
  }, [today])

  const hourlyData = useMemo(() => hourlyBuckets(today), [today])

  const recentTxns = useMemo(
    () =>
      transactions
        .filter((t) => t.status !== "refunded")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5),
    [transactions]
  )

  const topToday = useMemo(() => {
    const agg = new Map<string, { name: string; qty: number; revenue: number }>()
    for (const t of today) {
      for (const item of t.items) {
        const existing = agg.get(item.productId) || {
          name: item.name,
          qty: 0,
          revenue: 0,
        }
        existing.qty += item.quantity
        existing.revenue += item.unitPrice * item.quantity
        agg.set(item.productId, existing)
      }
    }
    return Array.from(agg.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [today])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Real-time operational overview for today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4" />
            Today's Revenue
          </div>
          <p className="mt-1 text-2xl font-bold">₱{todayRevenue.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingCart className="size-4" />
            Transactions
          </div>
          <p className="mt-1 text-2xl font-bold">{todayCount}</p>
        </div>
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="size-4" />
            Urgent Alerts
          </div>
          <p
            className={`mt-1 text-2xl font-bold ${urgentCount > 0 ? "text-red-600 dark:text-red-400" : ""}`}
          >
            {urgentCount}
          </p>
        </div>
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Banknote className="size-4" />
            Cash in Drawer
          </div>
          <p className="mt-1 text-2xl font-bold">₱{cashInDrawer.toFixed(2)}</p>
        </div>
      </div>

      {urgentCount > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/50">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
            <span className="font-semibold text-red-800 dark:text-red-200">
              Inventory Alerts
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {outOfStock.map((p) => (
              <Badge
                key={p.id}
                variant="outline"
                className="border-red-300 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900/60 dark:text-red-300"
              >
                {p.title} is OUT OF STOCK
              </Badge>
            ))}
            {lowStock.map((p) => (
              <Badge
                key={p.id}
                variant="outline"
                className="border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
              >
                {p.title} — Low Stock ({p.stock} {p.unit})
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold">Hourly Sales Today</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-zinc-200 dark:stroke-zinc-700"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  className="text-xs text-zinc-500"
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="text-xs text-zinc-500"
                  tickFormatter={(v) => `₱${v}`}
                />
                <Tooltip
                  formatter={(value) => [`₱${Number(value).toFixed(2)}`, "Revenue"]}
                  contentStyle={{
                    backgroundColor: "var(--color-popover, #fff)",
                    border: "1px solid var(--color-border, #e4e4e7)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold">Quick Actions</h3>
          <div className="flex flex-col gap-3">
            <Button
              className="w-full justify-start gap-3 h-12 text-base"
              onClick={() => navigate("/cashier")}
            >
              <ShoppingCart className="size-5" />
              New Sale
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => navigate("/inventory")}
            >
              <Plus className="size-5" />
              Add Product
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => navigate("/inventory")}
            >
              <Package className="size-5" />
              Manage Inventory
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => navigate("/sales")}
            >
              <Receipt className="size-5" />
              View Sales
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold">Recent Transactions</h3>
          {recentTxns.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions yet today.
            </p>
          ) : (
            <div className="space-y-3">
              {recentTxns.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{t.receiptId}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleTimeString("en-PH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">
                      ₱{t.total.toFixed(2)}
                    </p>
                    <Badge
                      variant="outline"
                      className={`mt-0.5 text-xs ${
                        t.paymentMethod === "cash"
                          ? "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                          : t.paymentMethod === "card"
                            ? "border-purple-300 bg-purple-100 text-purple-800 dark:border-purple-700 dark:bg-purple-900/60 dark:text-purple-300"
                            : "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {t.paymentMethod === "cash"
                        ? "Cash"
                        : t.paymentMethod === "card"
                          ? "Card"
                          : "Split"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold">Top Products Today</h3>
          {topToday.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No sales data today.
            </p>
          ) : (
            <div className="space-y-3">
              {topToday.map((p, i) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                      {i + 1}
                    </span>
                    <span className="truncate font-medium">{p.name}</span>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-semibold tabular-nums">{p.qty} sold</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      ₱{p.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
