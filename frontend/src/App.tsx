import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import PrizesPage from "./pages/dashboard/PrizesPage";
import GiveawaysPage from "./pages/dashboard/GiveawaysPage";
import ConnectionsPage from "./pages/dashboard/ConnectionsPage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";
import ViolationsPage from "./pages/dashboard/ViolationsPage";
import AppealPage from "./pages/dashboard/AppealPage";
import TicketsPage from "./pages/dashboard/TicketsPage";
import TicketDetailPage from "./pages/dashboard/TicketDetailPage";
import DashboardSettingsPage from "./pages/dashboard/DashboardSettingsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import MainPage from "./pages/main/MainPage";
import MomentsPage from "./pages/main/MomentsPage";
import RulesPage from "./pages/main/RulesPage";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import SchedulePage from "./pages/main/SchedulePage";
import StatusPage from "./pages/main/StatusPage";

function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { isAuthenticated, isLoading, userLevel } = useAuthStore();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#9caffc] text-xl font-bold">VOLTAGE...</div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (adminOnly && userLevel() < 30) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

function DashboardRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  const { loadUser } = useAuthStore();
  useEffect(() => {
    loadUser();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Публичный сайт */}
        <Route path="/" element={<MainPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/moments" element={<MomentsPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/status" element={<StatusPage />} />

        {/* Авторизация */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Личный кабинет */}
        <Route
          path="/dashboard"
          element={
            <DashboardRoute>
              <DashboardPage />
            </DashboardRoute>
          }
        />
        <Route
          path="/dashboard/prizes"
          element={
            <DashboardRoute>
              <PrizesPage />
            </DashboardRoute>
          }
        />
        <Route
          path="/dashboard/giveaways"
          element={
            <DashboardRoute>
              <GiveawaysPage />
            </DashboardRoute>
          }
        />
        <Route
          path="/dashboard/connections"
          element={
            <DashboardRoute>
              <ConnectionsPage />
            </DashboardRoute>
          }
        />
        <Route
          path="/dashboard/notifications"
          element={
            <DashboardRoute>
              <NotificationsPage />
            </DashboardRoute>
          }
        />
        <Route
          path="/dashboard/violations"
          element={
            <DashboardRoute>
              <ViolationsPage />
            </DashboardRoute>
          }
        />
        <Route
          path="/dashboard/violations/:id/appeal"
          element={
            <DashboardRoute>
              <AppealPage />
            </DashboardRoute>
          }
        />
        <Route
          path="/dashboard/tickets"
          element={
            <DashboardRoute>
              <TicketsPage />
            </DashboardRoute>
          }
        />
        <Route
          path="/dashboard/tickets/:id"
          element={
            <DashboardRoute>
              <TicketDetailPage />
            </DashboardRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <DashboardRoute>
              <DashboardSettingsPage />
            </DashboardRoute>
          }
        />

        {/* Админка */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
