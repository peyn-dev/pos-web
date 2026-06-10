import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  function toggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}>
      {resolvedTheme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
