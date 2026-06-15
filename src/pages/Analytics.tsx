import { useState, useEffect, useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, TrendingUp, DollarSign, ShoppingCart, Wallet } from "lucide-react"
import { getAllTransactions } from "@/lib/transactions"
import type { Transaction } from "@/lib/transactions"
import { getAllProducts } from "@/lib/inventory"
import type { Product } from "@/lib/inventory"

type RangePreset = "today" | "yesterday" | "7d" | "mtd" | "custom"

const RANGE_OPTIONS = [
  { value: "today" as RangePreset, label: "Today" },
  { value: "yesterday" as RangePreset, label: "Yesterday" },
  { value: "7d" as RangePreset, label: "Last 7 Days" },
  { value: "mtd" as RangePreset, label: "Month-to-Date" },
  { value: "custom" as RangePreset, label: "Custom" },
]

function getRange(range: RangePreset): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  if (range === "yesterday") {
    start.setDate(start.getDate() - 1)
    end.setDate(end.getDate() - 1)
  } else if (range === "7d") {
    start.setDate(start.getDate() - 6)
  } else if (range === "mtd") {
    start.setDate(1)
  }

  return { start, end }
}

const PIE_COLORS = ["#2563eb", "#7c3aed", "#71717a"]
const BAR_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444"]

export default function Analytics() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<RangePreset>("7d")

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

  const filtered = useMemo(() => {
    const { start, end } = getRange(range)
    return transactions.filter((t) => {
      if (t.status === "refunded") return false
      const d = new Date(t.createdAt)
      return d >= start && d <= end
    })
  }, [transactions, range])

  const grossRevenue = useMemo(
    () => filtered.reduce((s, t) => s + t.total, 0),
    [filtered]
  )

  const totalTransactions = filtered.length

  const aov = totalTransactions > 0 ? grossRevenue / totalTransactions : 0

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  )

  const netProfit = useMemo(() => {
    let profit = 0
    for (const txn of filtered) {
      for (const item of txn.items) {
        const prod = productMap.get(item.productId)
        if (prod) {
          profit += (prod.sellingPrice - prod.costPrice) * item.quantity
        }
      }
    }
    return profit
  }, [filtered, productMap])

  const salesOverTime = useMemo(() => {
    const { start, end } = getRange(range)
    const diffDays = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    )
    const useHourly = diffDays <= 1
    const buckets = new Map<string, number>()

    for (const txn of filtered) {
      const d = new Date(txn.createdAt)
      let key: string
      if (useHourly) {
        key = `${d.getHours()}:00`
      } else {
        key = d.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
      }
      buckets.set(key, (buckets.get(key) || 0) + txn.total)
    }

    if (useHourly) {
      const result = []
      for (let h = 0; h < 24; h++) {
        const key = `${h}:00`
        result.push({ label: key, revenue: buckets.get(key) || 0 })
      }
      return result
    }

    const result = []
    const current = new Date(start)
    while (current <= end) {
      const key = current.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      })
      result.push({ label: key, revenue: buckets.get(key) || 0 })
      current.setDate(current.getDate() + 1)
    }
    return result
  }, [filtered, range])

  const paymentSplit = useMemo(() => {
    let cash = 0
    let card = 0
    let split = 0
    for (const txn of filtered) {
      if (txn.paymentMethod === "cash") cash++
      else if (txn.paymentMethod === "card") card++
      else split++
    }
    return [
      { name: "Cash", value: cash, color: PIE_COLORS[0] },
      { name: "Card", value: card, color: PIE_COLORS[1] },
      { name: "Split", value: split, color: PIE_COLORS[2] },
    ].filter((d) => d.value > 0)
  }, [filtered])

  const topProducts = useMemo(() => {
    const agg = new Map<
      string,
      { name: string; sku: string; qty: number; revenue: number; profit: number }
    >()
    for (const txn of filtered) {
      for (const item of txn.items) {
        const existing = agg.get(item.productId) || {
          name: item.name,
          sku: item.sku,
          qty: 0,
          revenue: 0,
          profit: 0,
        }
        existing.qty += item.quantity
        existing.revenue += item.unitPrice * item.quantity
        const prod = productMap.get(item.productId)
        if (prod) {
          existing.profit +=
            (prod.sellingPrice - prod.costPrice) * item.quantity
        }
        agg.set(item.productId, existing)
      }
    }
    return Array.from(agg.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [filtered, productMap])

  const categoryBreakdown = useMemo(() => {
    const catMap = new Map<
      string,
      { revenue: number; count: number }
    >()
    for (const txn of filtered) {
      for (const item of txn.items) {
        const prod = productMap.get(item.productId)
        const cat = prod?.category || "Unknown"
        const existing = catMap.get(cat) || { revenue: 0, count: 0 }
        existing.revenue += item.unitPrice * item.quantity
        existing.count += item.quantity
        catMap.set(cat, existing)
      }
    }
    return Array.from(catMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [filtered, productMap])

  const inventoryValue = useMemo(() => {
    const cost = products.reduce((s, p) => s + p.stock * p.costPrice, 0)
    const retail = products.reduce((s, p) => s + p.stock * p.sellingPrice, 0)
    return { cost, retail, margin: retail - cost }
  }, [products])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Loading analytics...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Analytics & Reporting
          </h2>
          <p className="text-sm text-muted-foreground">
            Sales performance, product insights, and financial overview.
          </p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as RangePreset)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4" />
            Gross Revenue
          </div>
          <p className="mt-1 text-2xl font-bold">₱{grossRevenue.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="size-4" />
            Net Profit
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ₱{netProfit.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingCart className="size-4" />
            Total Transactions
          </div>
          <p className="mt-1 text-2xl font-bold">{totalTransactions}</p>
        </div>
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="size-4" />
            Avg Order Value
          </div>
          <p className="mt-1 text-2xl font-bold">₱{aov.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold">Sales Performance Over Time</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  className="text-xs text-zinc-500"
                  interval="preserveStartEnd"
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
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#2563eb" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold">Payment Method Split</h3>
          <div className="flex h-[300px] items-center justify-center">
            {paymentSplit.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentSplit}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {paymentSplit.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [Number(value), name]}
                    contentStyle={{
                      backgroundColor: "var(--color-popover, #fff)",
                      border: "1px solid var(--color-border, #e4e4e7)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold">Top Performing Products</h3>
          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No product sales data in this period.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((p) => (
                  <TableRow key={p.sku}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.qty}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      ₱{p.revenue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      ₱{p.profit.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold">Category Breakdown</h3>
          {categoryBreakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No category data in this period.
            </p>
          ) : (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdown}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-zinc-200 dark:stroke-zinc-700"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      className="text-xs text-zinc-500"
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
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                      {categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-2">
                {categoryBreakdown.map((cat, i) => {
                  const total = categoryBreakdown.reduce(
                    (s, c) => s + c.revenue,
                    0
                  )
                  const pct =
                    total > 0 ? ((cat.revenue / total) * 100).toFixed(1) : "0"
                  return (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-sm"
                          style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                        />
                        <span>{cat.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        ₱{cat.revenue.toFixed(2)} ({pct}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
        <h3 className="mb-4 text-sm font-semibold">Inventory Valuation & Capital</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Cost Value</p>
            <p className="text-xl font-bold">₱{inventoryValue.cost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Retail Value</p>
            <p className="text-xl font-bold">₱{inventoryValue.retail.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Potential Margin</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              ₱{inventoryValue.margin.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
