import { useState, useMemo } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  History
} from "lucide-react"
import { logoutUser, getSession } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

const SIDEBAR_OPEN = 240
const SIDEBAR_CLOSED = 60

const ALL_NAV = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", roles: ["Administrator"] },
  { label: "Cashier", icon: ShoppingCart, path: "/cashier", roles: ["Administrator", "cashier"] },
  { label: "Inventory", icon: Package, path: "/inventory", roles: ["Administrator"] },
  { label: "Sales History & Receipts", icon: History, path: "/sales", roles: ["Administrator"] },
  { label: "Analytics & Reporting", icon: BarChart3, path: "/analytics", roles: ["Administrator"] },
  { label: "User & Settings", icon: Settings, path: "/settings", roles: ["Administrator"] },
]

export default function AppLayout() {
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const session = getSession()
  const role = session?.role ?? "cashier"

  const navItems = useMemo(
    () => ALL_NAV.filter((item) => item.roles.includes(role)),
    [role]
  )

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className="sticky top-0 h-screen flex flex-col border-r bg-background transition-[width] duration-300 ease-in-out overflow-hidden"
        style={{ width: open ? SIDEBAR_OPEN : SIDEBAR_CLOSED }}
      >
        <div className="relative flex h-14 items-center border-b shrink-0">
          <span
            className={cn(
              "font-semibold whitespace-nowrap pl-4 transition-opacity duration-200",
              open ? "opacity-100" : "opacity-0"
            )}
          >
            AJ Gadjets
          </span>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-10 bg-background transition-all duration-300",
              open
                ? "right-8 translate-x-1/2"
                : "left-1/2 -translate-x-1/2"
            )}
            onClick={() => setOpen((p) => !p)}
          >
            {<Menu className="size-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2 overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Button
                key={item.path}
                variant={active ? "secondary" : "ghost"}
                size={open ? "default" : "icon"}
                title={!open ? item.label : undefined}
                className={cn(
                  "shrink-0",
                  open ? "w-full justify-start gap-3" : "w-full justify-center",
                  active && "bg-secondary font-medium"
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className="size-4 shrink-0" />
                <span
                  className={cn(
                    "overflow-hidden transition-[opacity,width] duration-200",
                    open ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}
                >
                  {item.label}
                </span>
              </Button>
            )
          })}
        </nav>

        <div className="border-t p-2 overflow-hidden">
          <Button
            variant="ghost"
            size={open ? "default" : "icon"}
            title={!open ? "Logout" : undefined}
            className={cn(
              "shrink-0",
              open ? "w-full justify-start gap-3" : "w-full justify-center",
              "text-muted-foreground"
            )}
            onClick={() => {
              logoutUser()
              navigate("/")
            }}
          >
            <LogOut className="size-4 shrink-0" />
            <span
              className={cn(
                "overflow-hidden transition-[opacity,width] duration-200",
                open ? "opacity-100 w-auto" : "opacity-0 w-0"
              )}
            >
              Logout
            </span>
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <h1 className="font-semibold truncate">
            {navItems.find((i) => i.path === location.pathname)?.label ?? "POS"}
          </h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
