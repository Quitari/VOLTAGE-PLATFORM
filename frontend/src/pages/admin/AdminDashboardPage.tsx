import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

const ADMIN_PAGES = [
  { path: "dashboard", label: "Дашборд", file: "admin_dashboard.html" },
  { path: "users", label: "Пользователи", file: "admin_users.html" },
  { path: "giveaways", label: "Розыгрыши", file: "admin_giveaways.html" },
  { path: "moderation", label: "Модерация", file: "admin_moderation.html" },
  { path: "appeals", label: "Апелляции", file: "admin_appeals.html" },
  { path: "tickets", label: "Тикеты", file: "admin_tickets.html" },
  { path: "prizes", label: "Призы", file: "admin_prizes.html" },
  { path: "settings", label: "Настройки", file: "admin_settings.html" },
  { path: "logs", label: "Журнал", file: "admin_logs.html" },
  { path: "roles", label: "Роли", file: "admin_roles.html" },
];

export default function AdminDashboardPage() {
  const [activePage, setActivePage] = useState("dashboard");
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const current = ADMIN_PAGES.find((p) => p.path === activePage);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <iframe
        key={activePage}
        src={`/prototypes/admin/${current?.file}`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        title={current?.label}
      />
    </div>
  );
}
