import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { giveawaysApi } from "../../api/giveaways";
import client from "../../api/client";
import type { Giveaway } from "../../types";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [lastPrize, setLastPrize] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [joined, setJoined] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [clipModal, setClipModal] = useState(false);
  const [clipForm, setClipForm] = useState({ title: "", url: "", game: "" });
  const [clipSubmitting, setClipSubmitting] = useState(false);
  const [clipSuccess, setClipSuccess] = useState(false);
  const [clipError, setClipError] = useState("");

  useEffect(() => {
    Promise.all([
      giveawaysApi.list({ status: "active" }),
      client.get("/giveaways/my-stats/"),
      client.get("/prizes/my/"),
    ])
      .then(([g, s, p]) => {
        setGiveaways(g.data);
        setStats(s.data);
        setLastPrize(p.data?.[0] || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    if (new URLSearchParams(location.search).get("suggest") === "clip") {
      setClipModal(true);
    }
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

  const handleClipSubmit = async () => {
    if (!clipForm.title.trim() || !clipForm.url.trim()) {
      setClipError("Укажи название и ссылку");
      return;
    }
    setClipSubmitting(true);
    setClipError("");
    try {
      await client.post("/clips/submit/", clipForm);
      setClipSuccess(true);
      setClipForm({ title: "", url: "", game: "" });
      setTimeout(() => {
        setClipModal(false);
        setClipSuccess(false);
      }, 2000);
    } catch (err: any) {
      setClipError(err.response?.data?.error || "Ошибка отправки");
    } finally {
      setClipSubmitting(false);
    }
  };

  const PRIZE_STATUS: Record<string, { label: string; color: string }> = {
    pending: { label: "Ожидает", color: "text-yellow-400" },
    processing: { label: "В обработке", color: "text-blue-400" },
    sent: { label: "Отправлен", color: "text-blue-400" },
    delivered: { label: "Получен", color: "text-green-400" },
    failed: { label: "Ошибка", color: "text-red-400" },
    cancelled: { label: "Отменён", color: "text-white/40" },
  };

  return (
    <div className="space-y-8">
      {/* Приветствие */}
      <div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
          Привет, <span className="text-[#FFE100]">{user?.username}!</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Участник с {user?.created_at?.slice(0, 10)}
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Участий",
            value: stats?.total_participations ?? "—",
            color: "text-white",
          },
          {
            label: "Побед",
            value: stats?.wins ?? "—",
            color: "text-[#FFE100]",
          },
          {
            label: "Активных",
            value: stats?.active_giveaways ?? "—",
            color: "text-white",
          },
          {
            label: "Нарушений",
            value: stats?.violations ?? "—",
            color: stats?.violations > 0 ? "text-red-400" : "text-green-400",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:scale-[1.02] transition-transform"
          >
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">
              {item.label}
            </p>
            <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Основной layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Левая часть — активные розыгрыши */}
        <div className="flex-1 space-y-4">
          <h2 className="text-xl font-black uppercase tracking-tight">
            Активные <span className="text-[#FFE100]">розыгрыши</span>
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
              ⚠️ {error}
            </div>
          )}

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {giveaways.map((g) => (
                <div
                  key={g.id}
                  className="bg-[#1C1B1B] hover:bg-[#2A2A2A] rounded-2xl overflow-hidden transition-all border border-white/5 relative"
                >
                  <div className="absolute top-3 left-3 flex gap-2 z-10">
                    <span className="bg-[#FFE100] text-[#211C00] px-2 py-0.5 rounded text-[10px] font-black uppercase">
                      {g.platform === "telegram"
                        ? "Telegram"
                        : g.platform === "twitch"
                          ? "Twitch"
                          : "Все"}
                    </span>
                    {joined.includes(g.id) && (
                      <span className="bg-green-500/90 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        Участвую
                      </span>
                    )}
                  </div>
                  <div className="h-32 bg-[#0E0E0E] flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-white/5"
                      style={{ fontSize: "64px" }}
                    >
                      redeem
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-white leading-tight">
                          {g.title}
                        </h3>
                        {g.skin_name && (
                          <p className="text-xs text-white/40 mt-0.5">
                            {g.skin_name}
                          </p>
                        )}
                      </div>
                    </div>
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
          )}
        </div>

        {/* Правая часть — последний приз + безопасность */}
        <div className="w-full lg:w-72 flex flex-col gap-6">
          {/* Последний приз */}
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-4">
              Последний <span className="text-[#FFE100]">приз</span>
            </h2>
            {lastPrize ? (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-5 border-l-4 border-l-[#FFE100]">
                <div className="h-32 bg-[#0E0E0E] rounded-xl mb-4 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-white/10"
                    style={{ fontSize: "48px" }}
                  >
                    inventory
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white mb-1">
                  {lastPrize.name}
                </h4>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">
                  {lastPrize.created_at?.slice(0, 10)}
                </p>
                <div
                  className={`text-xs font-bold ${PRIZE_STATUS[lastPrize.status]?.color || "text-white/40"}`}
                >
                  {PRIZE_STATUS[lastPrize.status]?.label || lastPrize.status}
                </div>
                <button
                  onClick={() => navigate("/dashboard/prizes")}
                  className="w-full mt-3 py-2 bg-[#1C1B1B] hover:bg-[#2A2A2A] text-xs font-bold uppercase tracking-widest transition-colors rounded-xl"
                >
                  Все призы
                </button>
              </div>
            ) : (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-5 text-center">
                <span className="material-symbols-outlined text-white/10 text-4xl block mb-2">
                  inventory
                </span>
                <p className="text-white/30 text-sm">Призов пока нет</p>
                <p className="text-white/20 text-xs mt-1">
                  Участвуй в розыгрышах!
                </p>
              </div>
            )}
          </div>

          {/* Безопасность */}
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-4">
              Безопасность
            </h2>
            {stats?.violations > 0 ? (
              <div className="bg-red-500/10 border-l-4 border-red-500 p-5 rounded-r-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-red-400 text-3xl">
                    warning
                  </span>
                  <span className="text-red-400 font-black text-lg leading-tight uppercase">
                    {stats.violations} нарушения
                  </span>
                </div>
                <p className="text-xs text-red-400/70 uppercase font-medium leading-relaxed">
                  Проверь раздел нарушений
                </p>
                <button
                  onClick={() => navigate("/dashboard/violations")}
                  className="mt-3 text-xs font-bold text-red-400 hover:underline uppercase tracking-widest"
                >
                  Подробнее →
                </button>
              </div>
            ) : (
              <div className="bg-green-500/10 border-l-4 border-green-500 p-5 rounded-r-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="material-symbols-outlined text-green-400 text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified_user
                  </span>
                  <span className="text-green-400 font-black text-lg leading-tight uppercase">
                    Нарушений нет
                  </span>
                </div>
                <p className="text-xs text-green-400/70 uppercase font-medium leading-relaxed">
                  Твой аккаунт в безопасности. Мы ценим честную игру.
                </p>
              </div>
            )}
          </div>

          {/* Предложить клип */}
          <button
            onClick={() => setClipModal(true)}
            className="bg-[#FFE100]/10 border border-[#FFE100]/20 rounded-2xl p-5 flex items-center gap-3 hover:bg-[#FFE100]/20 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl text-[#FFE100]">
              video_library
            </span>
            <span className="text-sm font-bold text-[#FFE100] uppercase tracking-widest">
              Предложить клип
            </span>
          </button>
        </div>
      </div>

      {/* Модалка — предложить клип */}
      {clipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-md space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight">
                Предложить клип
              </h2>
              <button
                onClick={() => {
                  setClipModal(false);
                  setClipError("");
                  setClipSuccess(false);
                }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {clipSuccess ? (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-6 rounded-xl text-center">
                <span className="material-symbols-outlined text-4xl block mb-2">
                  check_circle
                </span>
                <p className="font-bold">Клип отправлен на модерацию!</p>
                <p className="text-sm mt-1 text-green-400/60">
                  Мы рассмотрим его в ближайшее время
                </p>
              </div>
            ) : (
              <>
                {clipError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                    ⚠️ {clipError}
                  </div>
                )}
                <div className="space-y-4">
                  {[
                    {
                      field: "title",
                      label: "Название *",
                      placeholder: "Эпичный клатч 1 vs 5",
                    },
                    {
                      field: "url",
                      label: "Ссылка на клип *",
                      placeholder: "https://clips.twitch.tv/...",
                    },
                    {
                      field: "game",
                      label: "Игра",
                      placeholder: "CS2, Valorant...",
                    },
                  ].map((item) => (
                    <div key={item.field}>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                        {item.label}
                      </label>
                      <input
                        value={clipForm[item.field as keyof typeof clipForm]}
                        onChange={(e) =>
                          setClipForm({
                            ...clipForm,
                            [item.field]: e.target.value,
                          })
                        }
                        placeholder={item.placeholder}
                        className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleClipSubmit}
                  disabled={clipSubmitting}
                  className="w-full bg-[#FFE100] text-[#211C00] py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-[#FFE330] transition-colors disabled:opacity-50"
                >
                  {clipSubmitting ? "Отправляем..." : "Отправить на модерацию"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
