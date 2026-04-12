import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { giveawaysApi } from "../../../api/giveaways";
import type { Giveaway } from "../../../types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Черновик", color: "bg-white/10 text-white/40" },
  active: { label: "Активен", color: "bg-green-500/15 text-green-400" },
  drawing: { label: "Итоги", color: "bg-yellow-500/15 text-yellow-400" },
  finished: { label: "Завершён", color: "bg-blue-500/15 text-blue-400" },
  cancelled: { label: "Отменён", color: "bg-red-500/15 text-red-400" },
};

const PLATFORM_LABELS: Record<string, string> = {
  telegram: "Telegram",
  twitch: "Twitch",
  both: "Оба",
};

export default function GiveawaysPage() {
  const navigate = useNavigate();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = (status = "all") => {
    setLoading(true);
    giveawaysApi
      .list({ status })
      .then((res) => setGiveaways(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter]);

  const handleDraw = async (id: string) => {
    try {
      await giveawaysApi.draw(id);
      load(statusFilter);
    } catch {}
  };

  const handleActivate = async (id: string) => {
    try {
      await giveawaysApi.activate(id);
      load(statusFilter);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
            РОЗЫГРЫШИ
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Всего: {giveaways.length}
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/giveaways/create")}
          className="px-6 py-2.5 bg-[#FFE100] text-[#211C00] font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-[#FFE330] transition-colors"
        >
          + Создать розыгрыш
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex gap-1 border-b border-white/5">
        {["all", "active", "draft", "finished", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`pb-3 px-4 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${
              statusFilter === s
                ? "text-[#FFE100] border-[#FFE100]"
                : "text-white/40 border-transparent hover:text-white"
            }`}
          >
            {s === "all" ? "Все" : STATUS_LABELS[s]?.label}
          </button>
        ))}
      </div>

      {/* Таблица */}
      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#1C1B1B]">
              {[
                "Название",
                "Тип",
                "Платформа",
                "Статус",
                "Участников",
                "Создан",
                "Действия",
              ].map((h) => (
                <th
                  key={h}
                  className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-white/40 text-sm"
                >
                  Загрузка...
                </td>
              </tr>
            ) : giveaways.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-white/40 text-sm"
                >
                  Нет розыгрышей
                </td>
              </tr>
            ) : (
              giveaways.map((g) => {
                const st = STATUS_LABELS[g.status];
                return (
                  <tr
                    key={g.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{g.title}</p>
                      {g.skin_name && (
                        <p className="text-xs text-white/40 mt-0.5">
                          {g.skin_name}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/60">
                      {g.prize_type === "skin" ? "🔫 Скин" : "🎁 Другое"}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/60">
                      {PLATFORM_LABELS[g.platform] || g.platform}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${st?.color}`}
                      >
                        {st?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      {g.participants_count}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40">
                      {g.created_at.slice(0, 10)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {g.status === "draft" && (
                          <button
                            onClick={() => handleActivate(g.id)}
                            className="px-3 py-1.5 bg-green-500/15 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/25 transition-colors"
                          >
                            Запустить
                          </button>
                        )}
                        {g.status === "active" && (
                          <button
                            onClick={() => handleDraw(g.id)}
                            className="px-3 py-1.5 bg-[#FFE100]/15 text-[#FFE100] text-xs font-bold rounded-lg hover:bg-[#FFE100]/25 transition-colors"
                          >
                            Итоги
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
