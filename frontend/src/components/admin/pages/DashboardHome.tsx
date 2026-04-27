import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { giveawaysApi } from "../../../api/giveaways";
import client from "../../../api/client";
import type { Giveaway } from "../../../types";

const PLATFORM_LABELS: Record<string, string> = {
  telegram: "Telegram",
  twitch: "Twitch",
  both: "TG + TW",
  all: "Все",
};

const ACTION_ICON: Record<string, { icon: string; color: string }> = {
  "punishment.issue": { icon: "gavel", color: "text-red-400" },
  "punishment.revoke": { icon: "undo", color: "text-green-400" },
  "appeal.resolve": { icon: "balance", color: "text-blue-400" },
  "giveaway.create": { icon: "redeem", color: "text-[#9caffc]" },
  "giveaway.draw": { icon: "casino", color: "text-[#9caffc]" },
  "giveaway.cancel": { icon: "cancel", color: "text-white/40" },
  "role.assign": { icon: "shield", color: "text-purple-400" },
  "role.revoke": { icon: "shield_off", color: "text-white/40" },
  "settings.change": { icon: "settings", color: "text-blue-400" },
  "user.ban": { icon: "block", color: "text-red-400" },
  "user.login": { icon: "login", color: "text-white/40" },
  "user.register": { icon: "person_add", color: "text-green-400" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин. назад`;
  if (h < 24) return `${h} ч. назад`;
  return `${d} д. назад`;
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      giveawaysApi.list({ status: "active" }),
      client.get("/auth/admin-stats/"),
    ])
      .then(([g, s]) => {
        setGiveaways(g.data);
        setStats(s.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDraw = (id: string) => {
    navigate(`/admin/giveaways/${id}`);
  };

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
          ДАШБОРД
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Обзор платформы в реальном времени
        </p>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 border-l-4 border-l-[#9caffc]">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
            Новых сегодня
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {loading ? "..." : (stats?.new_users_today ?? 0)}
            </span>
          </div>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
            Активных розыгрышей
          </p>
          <span className="text-3xl font-black text-white">
            {loading ? "..." : giveaways.length}
          </span>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
            Призов выдано сегодня
          </p>
          <span className="text-3xl font-black text-white">
            {loading ? "..." : (stats?.prizes_today ?? 0)}
          </span>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
            Открытых тикетов
          </p>
          <span
            className={`text-3xl font-black ${(stats?.open_tickets ?? 0) > 0 ? "text-red-400" : "text-white"}`}
          >
            {loading ? "..." : (stats?.open_tickets ?? 0)}
          </span>
        </div>
      </div>

      {/* Нижний layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Активные розыгрыши — 2/3 */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black uppercase tracking-tight text-white">
              Активные розыгрыши
            </h2>
            <button
              onClick={() => navigate("/admin/giveaways")}
              className="text-xs font-bold text-[#9caffc] uppercase hover:underline"
            >
              Все розыгрыши
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#111] border border-white/5 rounded-xl p-4 animate-pulse h-20"
                />
              ))}
            </div>
          ) : giveaways.length === 0 ? (
            <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-white/10 text-5xl block mb-3">
                redeem
              </span>
              <p className="text-white/40 text-sm">Нет активных розыгрышей</p>
            </div>
          ) : (
            <div className="space-y-3">
              {giveaways.map((g) => (
                <div
                  key={g.id}
                  className="bg-[#111] border border-white/5 rounded-xl p-4 flex items-center gap-4"
                >
                  {/* Фото */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1C1B1B] flex-shrink-0">
                    {g.skin_image_url ? (
                      <img
                        src={g.skin_image_url}
                        alt={g.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/20">
                          redeem
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Инфо */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-white truncate mb-1">
                      {g.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase text-white ${
                          g.platform === "telegram"
                            ? "bg-[#0088cc]"
                            : g.platform === "twitch"
                              ? "bg-[#6441a5]"
                              : "bg-white/20"
                        }`}
                      >
                        {PLATFORM_LABELS[g.platform] || g.platform}
                      </span>
                      <span className="text-[10px] text-white/40 font-medium">
                        {g.participants_count} участников
                      </span>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {g.ends_at && (
                      <span className="text-xs font-bold text-white/60">
                        {new Date(g.ends_at).toLocaleDateString("ru-RU")}
                      </span>
                    )}
                    <button
                      onClick={() => handleDraw(g.id)}
                      className="bg-[#9caffc] text-[#0a0a0a] px-4 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-[#7b94f8] transition-all"
                    >
                      Подвести итоги
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Последние действия — 1/3 */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-black uppercase tracking-tight text-white mb-6">
            Последние действия
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-[#111] border border-white/5 rounded-xl p-4 animate-pulse h-16"
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
              {!stats?.recent_logs?.length ? (
                <div className="p-6 text-center text-white/30 text-sm">
                  Действий пока нет
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {stats.recent_logs.map((log: any) => {
                    const meta = ACTION_ICON[log.action_code] || {
                      icon: "info",
                      color: "text-white/40",
                    };
                    return (
                      <div
                        key={log.id}
                        className="p-4 flex gap-3 items-start hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="w-8 h-8 min-w-[2rem] rounded-lg bg-[#1C1B1B] flex items-center justify-center flex-shrink-0">
                          <span
                            className={`material-symbols-outlined text-base ${meta.color}`}
                          >
                            {meta.icon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-relaxed text-white/70">
                            <span className="font-black text-[#9caffc]">
                              {log.actor}
                            </span>{" "}
                            {log.action}
                            {log.target_user && (
                              <span className="text-white/50">
                                {" "}
                                → {log.target_user}
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-white/30 font-bold uppercase mt-0.5 block">
                            {timeAgo(log.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
