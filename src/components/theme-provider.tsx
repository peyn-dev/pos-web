import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light"
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  resolvedTheme: "light",
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "pos-web-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (typeof window !== "undefined" ? (localStorage.getItem(storageKey) as Theme) || defaultTheme : defaultTheme)
  )

  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("light")

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      const preferred = mq.matches ? "dark" : "light"
      root.classList.add(preferred)
      setResolvedTheme(preferred)

      const handler = (e: MediaQueryListEvent) => {
        const p = e.matches ? "dark" : "light"
        root.classList.remove("light", "dark")
        root.classList.add(p)
        setResolvedTheme(p)
      }
      mq.addEventListener("change", handler)
      return () => mq.removeEventListener("change", handler)
    }

    root.classList.add(theme)
    setResolvedTheme(theme)
  }, [theme])

  function setTheme(theme: Theme) {
    localStorage.setItem(storageKey, theme)
    setThemeState(theme)
  }

  return (
    <ThemeProviderContext.Provider {...props} value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (!context) throw new Error("useTheme must be used within a ThemeProvider")
  return context
}
