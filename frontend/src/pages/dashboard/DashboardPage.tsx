import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { giveawaysApi } from "../../api/giveaways";
import type { Giveaway } from "../../types";

export default function DashboardPage() {
  const { user, logout, userLevel } = useAuthStore();
  const navigate = useNavigate();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    giveawaysApi
      .list({ status: "active" })
      .then((res) => setGiveaways(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || "??";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-white/5 px-8 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#FFE100] tracking-tighter uppercase">
          VOLTAGE
        </h1>
        <div className="flex items-center gap-4">
          {userLevel() >= 30 && (
            <button
              onClick={() => navigate("/admin")}
              className="text-xs font-bold text-white/60 hover:text-[#FFE100] uppercase tracking-widest transition-colors"
            >
              ⚙️ Управление
            </button>
          )}
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors"
          >
            Выйти
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-10 space-y-8">
        {/* Профиль */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#1C1B1B] flex items-center justify-center text-[#FFE100] font-black text-xl flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-black text-white">{user?.username}</p>
            <div className="flex items-center gap-3 mt-1">
              {user?.roles?.length
                ? (() => {
                    const top = user.roles.reduce((p, c) =>
                      c.role.level > p.role.level ? c : p,
                    );
                    return (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: top.role.color + "20",
                          color: top.role.color,
                        }}
                      >
                        {top.role.name}
                      </span>
                    );
                  })()
                : null}
              <span className="text-white/40 text-xs">
                с {user?.created_at?.slice(0, 10)}
              </span>
            </div>
          </div>
          <div className="flex gap-4 text-center flex-shrink-0">
            <div>
              <p className="text-lg font-black text-white">
                {user?.has_steam ? "✅" : "❌"}
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                Steam
              </p>
            </div>
            <div>
              <p className="text-lg font-black text-white">
                {user?.has_twitch ? "✅" : "❌"}
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                Twitch
              </p>
            </div>
          </div>
        </div>

        {/* Активные розыгрыши */}
        <div>
          <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">
            Активные розыгрыши
          </h2>

          {loading ? (
            <p className="text-white/40 text-sm">Загрузка...</p>
          ) : giveaways.length === 0 ? (
            <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
              <p className="text-white/40 text-sm">
                Сейчас нет активных розыгрышей
              </p>
              <p className="text-white/20 text-xs mt-1">
                Следи за анонсами в Telegram
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {giveaways.map((g) => (
                <div
                  key={g.id}
                  className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-white">{g.title}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {g.platform === "telegram" ? "Telegram" : g.platform} ·{" "}
                      {g.participants_count} участников
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold bg-green-500/15 text-green-400 px-2 py-1 rounded-full">
                      Активен
                    </span>
                    <button
                      onClick={() => giveawaysApi.join(g.id).catch(() => {})}
                      className="px-4 py-2 bg-[#FFE100] text-[#211C00] text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-[#FFE330] transition-colors"
                    >
                      Участвовать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Быстрые ссылки */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: "inventory",
              label: "Мои призы",
              path: "/dashboard/prizes",
            },
            { icon: "person", label: "Профиль", path: "/dashboard/profile" },
            {
              icon: "settings",
              label: "Настройки",
              path: "/dashboard/settings",
            },
          ].map((item) => (
            <button
              key={item.path}
              className="bg-[#111] border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-[#1C1B1B] transition-colors"
            >
              <span className="material-symbols-outlined text-2xl text-white/40">
                {item.icon}
              </span>
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
