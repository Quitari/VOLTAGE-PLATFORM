import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "ОСНОВНОЕ",
    items: [
      { path: "/admin", icon: "dashboard", label: "Дашборд" },
      { path: "/admin/users", icon: "group", label: "Пользователи" },
      { path: "/admin/logs", icon: "history", label: "Журнал аудита" },
    ],
  },
  {
    title: "КОНТЕНТ",
    items: [
      { path: "/admin/giveaways", icon: "redeem", label: "Розыгрыши" },
      { path: "/admin/prizes", icon: "inventory", label: "Призы и доставка" },
      { path: "/admin/commands", icon: "terminal", label: "Команды Twitch" },
      { path: "/admin/clips", icon: "movie", label: "Клипы" },
    ],
  },
  {
    title: "МОДЕРАЦИЯ",
    items: [
      { path: "/admin/moderation", icon: "gavel", label: "Наказания" },
      { path: "/admin/appeals", icon: "balance", label: "Апелляции" },
      { path: "/admin/tickets", icon: "support_agent", label: "Тикеты" },
    ],
  },
  {
    title: "ПЛАТФОРМА",
    items: [
      { path: "/admin/settings", icon: "settings", label: "Настройки" },
      { path: "/admin/roles", icon: "shield", label: "Роли и права" },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(["ОСНОВНОЕ"]);

  const initials = user?.username?.slice(0, 2).toUpperCase() || "АД";

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) =>
      prev.includes(title) ? prev.filter((g) => g !== title) : [...prev, title],
    );
  };

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    for (const group of NAV_GROUPS) {
      if (group.items.some((item) => isActive(item.path))) {
        setOpenGroups((prev) =>
          prev.includes(group.title) ? prev : [...prev, group.title],
        );
      }
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-white">
      <aside
        className="fixed left-0 top-0 h-screen bg-[#0E0E0E] flex flex-col z-50 transition-all duration-200 overflow-hidden"
        style={{ width: collapsed ? 60 : 256 }}
      >
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
          {!collapsed && (
            <span className="text-xl font-black tracking-tighter text-[#0000CD] uppercase">
              VOLTAGE
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-[#1C1B1B] transition-all ml-auto"
          >
            <span className="material-symbols-outlined text-lg">menu</span>
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 mb-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#1C1B1B] flex items-center justify-center text-[#0000CD] font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="text-sm font-extrabold uppercase leading-tight text-white truncate">
                {user?.username}
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">
                {user?.roles?.[0]?.role?.name || "Owner"}
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="px-3 mb-3 flex justify-center flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#1C1B1B] flex items-center justify-center text-[#0000CD] font-bold text-sm">
              {initials}
            </div>
          </div>
        )}

        <div className="mx-4 mb-3 border-t border-white/5 flex-shrink-0" />

        <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
          {NAV_GROUPS.map((group) => {
            const isOpen = openGroups.includes(group.title);
            return (
              <div key={group.title}>
                {!collapsed && (
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-gray-600 tracking-[0.2em] uppercase hover:text-gray-400 transition-colors rounded"
                  >
                    <span>{group.title}</span>
                    <span
                      className="material-symbols-outlined text-sm transition-transform duration-200"
                      style={{
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    >
                      chevron_right
                    </span>
                  </button>
                )}

                {(isOpen || collapsed) && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 rounded-lg transition-colors text-sm ${
                          collapsed
                            ? "justify-center px-0 py-2.5"
                            : "px-3 py-2.5"
                        } ${
                          isActive(item.path)
                            ? "text-white border-l-2 border-[#0000CD] bg-[#1C1B1B] font-bold"
                            : "text-gray-400 hover:text-white hover:bg-[#1C1B1B]"
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        <span className="material-symbols-outlined text-xl flex-shrink-0">
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <span className="flex-1 text-left">{item.label}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

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

      <main
        className="flex-1 transition-all duration-200"
        style={{ marginLeft: collapsed ? 60 : 256 }}
      >
        <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between h-16 px-8">
          <h2 className="text-lg font-black text-white uppercase tracking-tight">
            Панель управления
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 px-4 py-2 bg-[#1C1B1B] hover:bg-[#2A2A2A] border border-white/5 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all"
            >
              <span className="material-symbols-outlined text-base">
                arrow_back
              </span>
              Дашборд
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
