import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

const NAV = [
  { path: "/dashboard", icon: "dashboard", label: "Обзор", exact: true },
  { path: "/dashboard/prizes", icon: "military_tech", label: "Мои призы" },
  { path: "/dashboard/giveaways", icon: "redeem", label: "Розыгрыши" },
  { path: "/dashboard/connections", icon: "link", label: "Привязки" },
  {
    path: "/dashboard/notifications",
    icon: "notifications",
    label: "Уведомления",
  },
  { path: "/dashboard/violations", icon: "gavel", label: "Нарушения" },
  { path: "/dashboard/settings", icon: "settings", label: "Настройки" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, userLevel } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const initials = user?.username?.slice(0, 2).toUpperCase() || "??";
  const topRole = user?.roles?.length
    ? user.roles.reduce((p: any, c: any) =>
        c.role.level > p.role.level ? c : p,
      )
    : null;

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div
      className="flex min-h-screen bg-[#0A0A0A] text-white"
      style={{ fontFamily: "Manrope, sans-serif" }}
    >
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 h-screen bg-[#0E0E0E] flex flex-col z-50 transition-all duration-200 overflow-hidden border-r border-white/5"
        style={{ width: collapsed ? 60 : 256 }}
      >
        {/* Лого + кнопка collapse */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
          {!collapsed && (
            <button
              onClick={() => navigate("/")}
              className="text-xl font-black tracking-tighter text-[#FFE100] uppercase hover:opacity-80 transition-opacity"
            >
              VOLTAGE
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-[#1C1B1B] transition-all ml-auto"
          >
            <span className="material-symbols-outlined text-lg">menu</span>
          </button>
        </div>

        {/* Профиль */}
        {!collapsed ? (
          <div className="px-4 mb-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#1C1B1B] flex items-center justify-center text-[#FFE100] font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="text-sm font-extrabold uppercase leading-tight text-white truncate">
                {user?.username}
              </span>
              <span
                className="text-[10px] font-medium tracking-widest uppercase truncate"
                style={{ color: topRole?.role?.color || "#6b7280" }}
              >
                {topRole?.role?.name || "Участник"}
              </span>
            </div>
          </div>
        ) : (
          <div className="px-3 mb-3 flex justify-center flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#1C1B1B] flex items-center justify-center text-[#FFE100] font-bold text-sm">
              {initials}
            </div>
          </div>
        )}

        <div className="mx-4 mb-3 border-t border-white/5 flex-shrink-0" />

        {/* Навигация */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
          {NAV.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 rounded-lg transition-colors text-sm ${
                  collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
                } ${
                  active
                    ? "text-[#FFE100] border-l-2 border-[#FFE100] bg-[#1C1B1B] font-bold"
                    : "text-gray-400 hover:text-white hover:bg-[#1C1B1B]"
                }`}
              >
                <span className="material-symbols-outlined text-xl flex-shrink-0">
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
              </button>
            );
          })}

          {/* Панель управления для админов */}
          {userLevel() >= 30 && (
            <>
              <div className="mx-1 my-2 border-t border-white/5" />
              <button
                onClick={() => navigate("/admin")}
                title={collapsed ? "Панель управления" : undefined}
                className={`w-full flex items-center gap-3 rounded-lg transition-colors text-sm text-gray-400 hover:text-[#FFE100] hover:bg-[#FFE100]/10 ${
                  collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
                }`}
              >
                <span className="material-symbols-outlined text-xl flex-shrink-0">
                  admin_panel_settings
                </span>
                {!collapsed && (
                  <span className="flex-1 text-left">Панель управления</span>
                )}
              </button>
            </>
          )}
        </nav>

        {/* Выход */}
        <div className="px-4 py-3 border-t border-white/5 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 text-gray-500 hover:text-red-400 transition-colors text-xs font-bold uppercase rounded-lg hover:bg-[#1C1B1B] py-2.5 ${
              collapsed ? "justify-center px-0" : "px-3"
            }`}
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            {!collapsed && <span>Выйти</span>}
          </button>
        </div>
      </aside>

      {/* Контент */}
      <main
        className="flex-1 transition-all duration-200"
        style={{ marginLeft: collapsed ? 60 : 256 }}
      >
        <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between h-16 px-8">
          <h2 className="text-lg font-black text-white uppercase tracking-tight">
            {NAV.find((n) => isActive(n.path, n.exact))?.label ||
              "Личный кабинет"}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard/notifications")}
              className="text-white/40 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <span className="text-xs text-white/40 font-bold uppercase tracking-widest">
              {user?.username}
            </span>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
