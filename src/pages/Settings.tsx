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
import { Loader2, Plus, User, Users } from "lucide-react"
import { registerUser, getAllUsers, getSession } from "@/lib/auth"
import type { AppUser } from "@/lib/auth"

export default function Settings() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "cashier" as "Administrator" | "cashier",
  })

  const session = getSession()

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const all = await getAllUsers()
    setUsers(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  function resetForm() {
    setForm({ username: "", password: "", role: "cashier" })
    setError("")
  }

  async function handleAddUser() {
    if (!form.username || !form.password) return
    setSaving(true)
    setError("")
    try {
      await registerUser(form.username, form.password, form.role)
      await loadUsers()
      resetForm()
      setAddOpen(false)
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
      else setError("Failed to create user")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User & Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage user accounts and roles.
        </p>
      </div>

      {session && (
        <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                <User className="size-5" />
              </div>
              <div>
                <p className="font-semibold">{session.username}</p>
                <Badge
                  variant="outline"
                  className={
                    session.role === "Administrator"
                      ? "border-purple-300 bg-purple-100 text-purple-800 dark:border-purple-700 dark:bg-purple-900/60 dark:text-purple-300"
                      : "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  }
                >
                  {session.role === "Administrator" ? "Administrator" : "Cashier"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">User Accounts</h3>
        </div>
        <Dialog
          open={addOpen}
          onOpenChange={(v) => {
            setAddOpen(v)
            if (!v) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 size-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Create User Account</DialogTitle>
              <DialogDescription>
                Add a new cashier or administrator account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="jdelacruz"
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, username: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      role: v as "Administrator" | "cashier",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setAddOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={!form.username || !form.password || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          Loading users...
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              {users.map((user) => (
                <TableRow key={user.username}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.role === "Administrator"
                          ? "border-purple-300 bg-purple-100 text-purple-800 dark:border-purple-700 dark:bg-purple-900/60 dark:text-purple-300"
                          : "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      }
                    >
                      {user.role === "Administrator" ? "Administrator" : "Cashier"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
