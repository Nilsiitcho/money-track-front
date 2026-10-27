import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./auth/LoginPage";
import { RequireAuth } from "./auth/RequireAuth";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { EntriesPage } from "./pages/EntriesPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { ReportPage } from "./pages/ReportPage";
import { ReservaPage } from "./pages/ReservaPage";
import { ConfigPage } from "./pages/ConfigPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/reserva" element={<ReservaPage />} />
          <Route path="/entries" element={<EntriesPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/config" element={<ConfigPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
