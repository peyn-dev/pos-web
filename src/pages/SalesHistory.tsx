import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Receipt,
  Printer,
  Mail,
  RotateCcw,
  Loader2,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Wallet,
} from "lucide-react"
import type { Transaction } from "@/lib/transactions"
import { getAllTransactions, seedTransactions } from "@/lib/transactions"

type DateFilter = "all" | "today" | "yesterday" | "week"

function isToday(d: Date) {
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

function isYesterday(d: Date) {
  const now = new Date()
  const y = new Date(now)
  y.setDate(y.getDate() - 1)
  return d.toDateString() === y.toDateString()
}

function isThisWeek(d: Date) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0, 0, 0, 0)
  return d >= start
}

const paymentBadge: Record<
  string,
  { label: string; className: string }
> = {
  cash: {
    label: "Cash",
    className:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/60 dark:text-blue-300 dark:border-blue-700",
  },
  card: {
    label: "Card",
    className:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/60 dark:text-purple-300 dark:border-purple-700",
  },
  split: {
    label: "Split",
    className:
      "bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600",
  },
}

const dateOptions: { value: DateFilter; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This Week" },
]

function handlePrint(txn: Transaction) {
  const lines = [
    `      POS System`,
    `   123 Main Street, Manila`,
    `   Tel: (02) 1234-5678`,
    `──────────────────────────────`,
    `  ${new Date(txn.createdAt).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    `  Receipt #${txn.receiptId}`,
    `──────────────────────────────`,
    `  Item                 Qty  Amt`,
    ...txn.items.map(
      (item) =>
        `  ${item.name.padEnd(20).slice(0, 20)} ${String(item.quantity).padStart(3)} ₱${(item.unitPrice * item.quantity).toFixed(2).padStart(7)}`
    ),
    `──────────────────────────────`,
    `  Subtotal             ₱${txn.subtotal.toFixed(2).padStart(8)}`,
    ...(txn.discountPercent > 0
      ? [
          `  Discount (${txn.discountPercent}%)     -₱${txn.discountAmount.toFixed(2).padStart(6)}`,
        ]
      : []),
    `  Total                ₱${txn.total.toFixed(2).padStart(8)}`,
    `──────────────────────────────`,
    `  Payment:  ${txn.paymentMethod.charAt(0).toUpperCase() + txn.paymentMethod.slice(1)}`,
    ...(txn.paymentMethod === "cash"
      ? [
          `  Tendered: ₱${txn.cashTendered.toFixed(2)}`,
          `  Change:   ₱${txn.change.toFixed(2)}`,
        ]
      : []),
    ``,
    `       Thank you!`,
    ``,
  ]

  const win = window.open("", "_blank")
  if (!win) return
  win.document.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt ${txn.receiptId}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    line-height: 1.4;
    padding: 10px 8px;
    color: #000;
    background: #fff;
    width: 72mm;
    margin: 0 auto;
  }
  pre { font-family: inherit; white-space: pre; }
</style>
</head>
<body><pre>${lines.join("\n")}</pre></body>
</html>`)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
}

export default function SalesHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      await seedTransactions()
      const txns = await getAllTransactions()
      setTransactions(txns)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = transactions

    if (dateFilter === "today")
      list = list.filter((t) => isToday(new Date(t.createdAt)))
    else if (dateFilter === "yesterday")
      list = list.filter((t) => isYesterday(new Date(t.createdAt)))
    else if (dateFilter === "week")
      list = list.filter((t) => isThisWeek(new Date(t.createdAt)))

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.receiptId.toLowerCase().includes(q)
      )
    }

    return list
  }, [transactions, dateFilter, search])

  const selected = transactions.find((t) => t.id === selectedId) ?? null

  const todayTxns = transactions.filter((t) => isToday(new Date(t.createdAt)))
  const todayTotal = todayTxns.reduce((s, t) => s + t.total, 0)
  const todayCount = todayTxns.length
  const refundedCount = transactions.filter((t) => t.status === "refunded").length
  const grossTotal = transactions.reduce((s, t) => s + t.subtotal, 0)
  const discountsTotal = transactions.reduce((s, t) => s + t.discountAmount, 0)
  const refundedTotal = transactions
    .filter((t) => t.status === "refunded")
    .reduce((s, t) => s + t.total, 0)
  const netRevenue = grossTotal - discountsTotal - refundedTotal

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Loading sales history...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Sales History & Receipts</h2>
        <p className="text-sm text-muted-foreground">
          View completed transactions, reprint receipts, and process refunds.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4" />
            Total Sales Today
          </div>
          <p className="mt-1 text-2xl font-bold">₱{todayTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingBag className="size-4" />
            Transactions
          </div>
          <p className="mt-1 text-2xl font-bold">{todayCount}</p>
        </div>
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="size-4" />
            Refunded Invoices
          </div>
          <p
            className={`mt-1 text-2xl font-bold ${refundedCount > 0 ? "text-red-600 dark:text-red-400" : ""}`}
          >
            {refundedCount}
          </p>
        </div>
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="size-4" />
            Net Revenue
          </div>
          <p className="mt-1 text-2xl font-bold">₱{netRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-24rem)] -mx-4 sm:-mx-6">
        <div className="flex w-8/12 flex-col border-r border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 border-b border-zinc-200 p-4 dark:border-zinc-800">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by Receipt ID..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={dateFilter}
              onValueChange={(v) => setDateFilter(v as DateFilter)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-y-auto max-h-[420px]">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((txn) => {
                    const pay = paymentBadge[txn.paymentMethod]
                    const statusBadge =
                      txn.status === "paid"
                        ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/60 dark:text-green-300 dark:border-green-700"
                        : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/60 dark:text-red-300 dark:border-red-700"
                    return (
                      <TableRow
                        key={txn.id}
                        className={`cursor-pointer ${selectedId === txn.id ? "bg-zinc-100 dark:bg-zinc-800/50" : ""}`}
                        onClick={() => setSelectedId(txn.id)}
                      >
                        <TableCell className="font-mono text-xs font-medium">
                          {txn.receiptId}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(txn.createdAt).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {txn.items.reduce((s, i) => s + i.quantity, 0)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          ₱{txn.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={pay.className}
                          >
                            {pay.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusBadge}
                          >
                            {txn.status === "paid" ? "Paid" : "Refunded"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="link"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedId(txn.id)
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="flex w-4/12 flex-col bg-white dark:bg-zinc-900">
          {!selected ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <Receipt className="mx-auto mb-3 size-12 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Select a transaction ledger row to inspect receipt details.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <span className="font-semibold">Receipt Detail</span>
                <p className="text-xs text-muted-foreground">
                  {selected.receiptId}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-700/50 dark:bg-zinc-800/50">
                  <div className="mb-3 text-center">
                    <p className="text-base font-bold">POS System</p>
                    <p className="text-xs text-muted-foreground">
                      123 Main Street, Manila
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tel: (02) 1234-5678
                    </p>
                    <div className="my-2 border-t border-dashed border-zinc-300 dark:border-zinc-600" />
                    <p className="text-xs text-muted-foreground">
                      {new Date(selected.createdAt).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Receipt #{selected.receiptId}
                    </p>
                  </div>

                  <div className="my-2 border-t border-dashed border-zinc-300 dark:border-zinc-600" />

                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="pb-1 text-left font-medium">Item</th>
                        <th className="pb-1 text-right font-medium">Qty</th>
                        <th className="pb-1 text-right font-medium">Price</th>
                        <th className="pb-1 text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item, i) => (
                        <tr key={i}>
                          <td className="py-0.5 pr-2">{item.name}</td>
                          <td className="py-0.5 text-right tabular-nums">
                            {item.quantity}
                          </td>
                          <td className="py-0.5 text-right tabular-nums">
                            ₱{item.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-0.5 text-right tabular-nums font-medium">
                            ₱{(item.unitPrice * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="my-2 border-t border-dashed border-zinc-300 dark:border-zinc-600" />

                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="tabular-nums">
                        ₱{selected.subtotal.toFixed(2)}
                      </span>
                    </div>
                    {selected.discountPercent > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Discount ({selected.discountPercent}%)</span>
                        <span className="tabular-nums">
                          -₱{selected.discountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-dashed border-zinc-300 pt-1 text-sm font-bold dark:border-zinc-600">
                      <span>Total</span>
                      <span className="tabular-nums">
                        ₱{selected.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="my-2 border-t border-dashed border-zinc-300 dark:border-zinc-600" />

                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment</span>
                      <span className="font-medium capitalize">
                        {selected.paymentMethod}
                      </span>
                    </div>
                    {selected.paymentMethod === "cash" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Tendered
                          </span>
                          <span className="tabular-nums">
                            ₱{selected.cashTendered.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Change
                          </span>
                          <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                            ₱{selected.change.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      Thank you for your purchase!
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-zinc-200 p-4 dark:border-zinc-800">
                <Button className="w-full" onClick={() => handlePrint(selected)}>
                  <Printer className="mr-2 size-4" />
                  Reprint Thermal Ticket
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    <Mail className="mr-2 size-4" />
                    Email Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selected.status === "refunded"}
                  >
                    <RotateCcw className="mr-2 size-4" />
                    Process Refund
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
