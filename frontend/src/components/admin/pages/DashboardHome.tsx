import { useEffect, useState } from "react";
import { giveawaysApi } from "../../../api/giveaways";
import type { Giveaway } from "../../../types";

export default function DashboardHome() {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    giveawaysApi
      .list({ status: "active" })
      .then((res) => setGiveaways(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Активных розыгрышей",
            value: giveaways.length,
            icon: "redeem",
            color: "text-[#FFE100]",
          },
          {
            label: "Новых пользователей",
            value: "—",
            icon: "group",
            color: "text-blue-400",
          },
          {
            label: "Призов выдано",
            value: "—",
            icon: "inventory",
            color: "text-green-400",
          },
          {
            label: "Открытых тикетов",
            value: "—",
            icon: "support_agent",
            color: "text-orange-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#111] border border-white/5 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {stat.label}
              </span>
              <span
                className={`material-symbols-outlined text-xl ${stat.color}`}
              >
                {stat.icon}
              </span>
            </div>
            <p className={`text-3xl font-black ${stat.color}`}>
              {loading ? "..." : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Active giveaways */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">
          Активные розыгрыши
        </h3>

        {loading ? (
          <p className="text-white/40 text-sm">Загрузка...</p>
        ) : giveaways.length === 0 ? (
          <p className="text-white/40 text-sm">Нет активных розыгрышей</p>
        ) : (
          <div className="space-y-3">
            {giveaways.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-4 bg-[#1C1B1B] rounded-xl border border-white/5"
              >
                <div>
                  <p className="font-bold text-white text-sm">{g.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {g.platform} · {g.participants_count} участников
                  </p>
                </div>
                <span className="text-[10px] font-black bg-green-500/15 text-green-400 px-2 py-1 rounded-full uppercase">
                  Активен
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
