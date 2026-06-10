import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import SalesHistory from "./pages/SalesHistory";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Register from "./pages/Register";
import AppLayout from "./components/layout/AppLayout";
import { ThemeProvider } from "./components/theme-provider";
import { ProtectedRoute } from "./routes/ProtectRoute";
import { PublicRoute } from "./routes/PublicRoutes";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="pos-web-ui-theme">
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/register" element={<Register />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<SalesHistory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
