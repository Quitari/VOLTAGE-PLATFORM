import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/auth";
import { giveawaysApi } from "../../api/giveaways";
import type { Giveaway } from "../../types";

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Активен", color: "text-green-400", bg: "bg-green-400/10" },
  drawing: {
    label: "Подведение",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  finished: { label: "Завершён", color: "text-white/40", bg: "bg-white/5" },
  cancelled: { label: "Отменён", color: "text-red-400", bg: "bg-red-400/10" },
  draft: { label: "Черновик", color: "text-white/40", bg: "bg-white/5" },
};

export default function GiveawaysPage() {
  const { user } = useAuthStore();
  const [active, setActive] = useState<Giveaway[]>([]);
  const [finished, setFinished] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [joined, setJoined] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "finished">("active");

  useEffect(() => {
    Promise.all([
      giveawaysApi.list({ status: "active" }),
      giveawaysApi.list({ status: "finished" }),
    ])
      .then(([a, f]) => {
        setActive(a.data);
        setFinished(f.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (id: string) => {
    setJoining(id);
    setError(null);
    try {
      await giveawaysApi.join(id);
      setJoined((prev) => [...prev, id]);
    } catch (err: any) {
      setError(err.response?.data?.error || "Ошибка");
      setTimeout(() => setError(null), 4000);
    } finally {
      setJoining(null);
    }
  };

  const PLATFORM: Record<string, string> = {
    telegram: "Telegram",
    twitch: "Twitch",
    all: "Все платформы",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
          Роз<span className="text-[#FFE100]">ыгрыши</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Активные и завершённые розыгрыши
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {/* Табы */}
      <div className="flex gap-2">
        {[
          { id: "active", label: "Активные", count: active.length },
          { id: "finished", label: "Завершённые", count: finished.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${
              tab === t.id
                ? "bg-[#FFE100] text-[#211C00]"
                : "bg-[#111] border border-white/5 text-white/40 hover:text-white"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-lg font-black ${
                  tab === t.id
                    ? "bg-[#211C00]/20 text-[#211C00]"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-white/40 text-sm">Загрузка...</p>
      ) : tab === "active" ? (
        active.length === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-white/10 text-7xl block mb-4">
              redeem
            </span>
            <p className="text-white/40 text-lg font-bold uppercase">
              Нет активных розыгрышей
            </p>
            <p className="text-white/20 text-sm mt-2">
              Следи за анонсами в Telegram
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((g) => (
              <div
                key={g.id}
                className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden hover:bg-[#1C1B1B] transition-colors"
              >
                <div className="h-32 bg-[#0E0E0E] flex items-center justify-center relative">
                  <span
                    className="material-symbols-outlined text-white/5"
                    style={{ fontSize: "64px" }}
                  >
                    redeem
                  </span>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-[#FFE100] text-[#211C00] text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      {PLATFORM[g.platform] || g.platform}
                    </span>
                    {joined.includes(g.id) && (
                      <span className="bg-green-500/90 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase flex items-center gap-1">
                        <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                        Участвую
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-white mb-1">{g.title}</h3>
                  {g.skin_name && (
                    <p className="text-xs text-white/40 mb-3">{g.skin_name}</p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1 text-xs text-white/40">
                      <span className="material-symbols-outlined text-sm">
                        groups
                      </span>
                      {g.participants_count} участников
                    </div>
                    <button
                      onClick={() => handleJoin(g.id)}
                      disabled={joining === g.id || joined.includes(g.id)}
                      className="px-3 py-1.5 bg-[#FFE100] text-[#211C00] text-xs font-bold rounded-lg uppercase hover:bg-[#FFE330] transition-colors disabled:opacity-50"
                    >
                      {joining === g.id
                        ? "..."
                        : joined.includes(g.id)
                          ? "✅ Участвуешь"
                          : "Участвовать"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : finished.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-white/10 text-7xl block mb-4">
            history
          </span>
          <p className="text-white/40 text-lg font-bold uppercase">
            Нет завершённых розыгрышей
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {finished.map((g) => {
            const winner = g.winners?.[0];
            const isWinner = winner?.user?.username === user?.username;
            return (
              <div
                key={g.id}
                className={`bg-[#111] border rounded-2xl p-5 flex items-center gap-5 ${isWinner ? "border-[#FFE100]/30" : "border-white/5"}`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#1C1B1B] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white/20">
                    redeem
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-white truncate">{g.title}</p>
                    {isWinner && (
                      <span className="text-[10px] font-black bg-[#FFE100] text-[#211C00] px-2 py-0.5 rounded uppercase flex-shrink-0">
                        🏆 Победитель
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span>{PLATFORM[g.platform] || g.platform}</span>
                    <span>·</span>
                    <span>{g.participants_count} участников</span>
                    {winner && (
                      <>
                        <span>·</span>
                        <span>Победил: {winner.user?.username}</span>
                      </>
                    )}
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl uppercase ${STATUS.finished.bg} ${STATUS.finished.color}`}
                >
                  Завершён
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
