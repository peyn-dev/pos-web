import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Package,
  Receipt,
  BarChart3,
  Settings,
  Menu,
  LogOut,
} from "lucide-react"
import { logoutUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Inventory", icon: Package, path: "/inventory" },
  { label: "Sales History & Receipts", icon: Receipt, path: "/sales" },
  { label: "Analytics & Reporting", icon: BarChart3, path: "/analytics" },
  { label: "User & Settings Configuration", icon: Settings, path: "/settings" },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="size-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col p-0">
            <div className="flex h-14 items-center border-b px-6 font-semibold">
              POS System
            </div>
            <nav className="flex-1 space-y-1 p-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = location.pathname === item.path
                return (
                  <Button
                    key={item.path}
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      active && "bg-secondary font-medium"
                    )}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Button>
                )
              })}
            </nav>
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground"
                onClick={() => {
                  logoutUser()
                  navigate("/")
                }}
              >
                <LogOut className="size-4" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <span className="font-semibold">
          {navItems.find((i) => i.path === location.pathname)?.label ?? "POS"}
        </span>
      </header>
      <main className="p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}
