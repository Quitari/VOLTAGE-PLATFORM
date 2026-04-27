import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../../api/client";
import { moderationApi } from "../../../api/moderation";

const PUNISHMENT_TYPES = [
  {
    value: "warning",
    label: "Предупредить",
    icon: "warning",
    color: "hover:text-yellow-400",
  },
  {
    value: "mute",
    label: "Мут",
    icon: "mic_off",
    color: "hover:text-orange-400",
  },
  { value: "ban", label: "Бан", icon: "block", color: "hover:text-red-400" },
];

const PLATFORMS = [
  { value: "all", label: "Все платформы" },
  { value: "telegram", label: "Telegram" },
  { value: "twitch", label: "Twitch" },
  { value: "site", label: "Сайт" },
];

const PRIZE_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Ожидает", color: "text-yellow-400" },
  processing: { label: "В обработке", color: "text-blue-400" },
  sent: { label: "Отправлен", color: "text-blue-400" },
  delivered: { label: "Получен", color: "text-green-400" },
  failed: { label: "Ошибка", color: "text-red-400" },
  cancelled: { label: "Отменён", color: "text-white/40" },
};

const PUNISHMENT_COLOR: Record<string, string> = {
  warning: "text-yellow-400 bg-yellow-400/10",
  mute: "text-orange-400 bg-orange-400/10",
  ban: "text-red-400 bg-red-400/10",
};

const PLATFORM_LABELS: Record<string, string> = {
  telegram: "TG",
  twitch: "TW",
  both: "TG+TW",
  all: "Все",
  site: "Сайт",
};

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<
    "prizes" | "violations" | "activity" | "settings"
  >("prizes");
  const [prizeFilter, setPrizeFilter] = useState<"all" | "wins" | "lost">(
    "all",
  );
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Модалка наказания
  const [punishModal, setPunishModal] = useState(false);
  const [punishType, setPunishType] = useState("warning");
  const [punishForm, setPunishForm] = useState({
    platform: "all",
    reason: "",
    expires_at: "",
  });
  const [punishing, setPunishing] = useState(false);
  const [punishError, setPunishError] = useState("");
  const [punishSuccess, setPunishSuccess] = useState("");

  // Модалка отмены
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Настройки профиля (таб)
  const [roleForm, setRoleForm] = useState({ note: "" });

  const load = () => {
    setLoading(true);
    client
      .get(`/auth/users/${id}/`)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  // Закрытие меню по клику вне
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node)
      ) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openPunish = (type: string) => {
    setPunishType(type);
    setPunishForm({ platform: "all", reason: "", expires_at: "" });
    setPunishError("");
    setPunishSuccess("");
    setPunishModal(true);
  };

  const handlePunish = async () => {
    if (!punishForm.reason.trim()) {
      setPunishError("Укажи причину");
      return;
    }
    setPunishing(true);
    setPunishError("");
    try {
      await moderationApi.punish(id!, {
        punishment_type: punishType,
        platform: punishForm.platform,
        reason: punishForm.reason,
        expires_at: punishForm.expires_at || undefined,
      });
      setPunishSuccess("Наказание выдано");
      setTimeout(() => {
        setPunishModal(false);
        setPunishSuccess("");
      }, 1500);
      load();
    } catch (err: any) {
      setPunishError(err.response?.data?.error || "Ошибка");
    } finally {
      setPunishing(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeId) return;
    setRevoking(true);
    try {
      await moderationApi.revoke(revokeId);
      setRevokeId(null);
      load();
    } catch {
    } finally {
      setRevoking(false);
    }
  };

  if (loading) return <p className="text-white/40 text-sm">Загрузка...</p>;
  if (!data)
    return <p className="text-red-400 text-sm">Пользователь не найден</p>;

  const { user, stats, violations, prizes, participations } = data;
  const initials = user.username?.slice(0, 2).toUpperCase();
  const topRole = user.roles?.length
    ? user.roles.reduce((p: any, c: any) =>
        c.role.level > p.role.level ? c : p,
      )
    : null;

  const filteredPrizes = prizes.filter((p: any) => {
    if (prizeFilter === "wins") return p.status !== "cancelled";
    if (prizeFilter === "lost") return p.status === "cancelled";
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Модалка наказания */}
      {punishModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase">
                {PUNISHMENT_TYPES.find((t) => t.value === punishType)?.label}
              </h3>
              <button
                onClick={() => setPunishModal(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-[#1C1B1B] rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">
                  Пользователь
                </p>
                <p className="text-white font-bold">{user.username}</p>
              </div>
              <div className="flex gap-1">
                {PUNISHMENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setPunishType(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      punishType === t.value
                        ? "bg-[#9caffc] text-[#0a0a0a]"
                        : "bg-[#111] text-white/40 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {punishError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                ⚠️ {punishError}
              </div>
            )}
            {punishSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl">
                ✅ {punishSuccess}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                Платформа
              </label>
              <select
                value={punishForm.platform}
                onChange={(e) =>
                  setPunishForm((p) => ({ ...p, platform: e.target.value }))
                }
                className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none"
              >
                {PLATFORMS.map((pl) => (
                  <option key={pl.value} value={pl.value}>
                    {pl.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                Причина *
              </label>
              <textarea
                value={punishForm.reason}
                onChange={(e) =>
                  setPunishForm((p) => ({ ...p, reason: e.target.value }))
                }
                placeholder="Укажи причину..."
                rows={3}
                className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                Срок (необязательно)
              </label>
              <input
                type="datetime-local"
                value={punishForm.expires_at}
                onChange={(e) =>
                  setPunishForm((p) => ({ ...p, expires_at: e.target.value }))
                }
                className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPunishModal(false)}
                className="flex-1 py-3 bg-[#1C1B1B] text-white/60 font-bold rounded-xl uppercase text-xs hover:bg-[#2A2A2A] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handlePunish}
                disabled={punishing}
                className="flex-1 py-3 bg-red-500/20 text-red-400 font-bold rounded-xl uppercase text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {punishing ? "Выдаём..." : "Выдать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка отмены */}
      {revokeId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-black text-white uppercase">
              Отменить наказание?
            </h3>
            <p className="text-white/50 text-sm">
              Наказание будет снято немедленно.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRevokeId(null)}
                className="flex-1 py-3 bg-[#1C1B1B] text-white/60 font-bold rounded-xl uppercase text-xs hover:bg-[#2A2A2A] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="flex-1 py-3 bg-green-500/20 text-green-400 font-bold rounded-xl uppercase text-xs hover:bg-green-500/30 transition-colors disabled:opacity-50"
              >
                {revoking ? "..." : "Снять"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-white/30 font-bold uppercase tracking-widest">
        <button
          onClick={() => navigate("/admin")}
          className="hover:text-white transition-colors"
        >
          Админ
        </button>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <button
          onClick={() => navigate("/admin/users")}
          className="hover:text-white transition-colors"
        >
          Пользователи
        </button>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#9caffc]">{user.username}</span>
      </nav>

      {/* Профиль */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[#1C1B1B] flex items-center justify-center text-2xl font-black text-[#9caffc]">
                {initials}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-[#111] rounded-full ${
                  user.status === "active"
                    ? "bg-green-500"
                    : user.status === "banned"
                      ? "bg-red-500"
                      : "bg-white/20"
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                  {user.username}
                </h1>
                {topRole && (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full cursor-help"
                    style={{
                      background: topRole.role.color + "20",
                      color: topRole.role.color,
                    }}
                  >
                    {topRole.role.name}
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                    user.status === "active"
                      ? "bg-green-500/15 text-green-400"
                      : user.status === "banned"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-white/10 text-white/40"
                  }`}
                >
                  {user.status === "active"
                    ? "Активен"
                    : user.status === "banned"
                      ? "Заблокирован"
                      : user.status}
                </span>
              </div>
              <p className="text-sm text-white/40 mb-3">
                {user.email || "Email не указан"} · ID: {user.id?.slice(0, 8)} ·
                с {user.created_at?.slice(0, 10)}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {user.has_telegram && (
                  <span className="bg-[#24A1DE]/15 text-[#24A1DE] text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      send
                    </span>
                    {user.telegram_username ? `@${user.telegram_username}` : ""}
                    {user.telegram_id && (
                      <span className="opacity-60 ml-1">
                        ID: {user.telegram_id}
                      </span>
                    )}
                  </span>
                )}
                {user.has_twitch && (
                  <span className="bg-[#9146FF]/15 text-[#9146FF] text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      live_tv
                    </span>
                    {user.twitch_username}
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    user.has_steam
                      ? "bg-white/5 text-white/40"
                      : "bg-white/5 text-white/20"
                  }`}
                >
                  {user.has_steam ? "Steam ✓" : "Steam не привязан"}
                </span>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {PUNISHMENT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => openPunish(t.value)}
                className={`flex items-center gap-2 px-4 py-2.5 bg-[#1C1B1B] hover:bg-[#2A2A2A] border border-white/5 text-white/70 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${t.color}`}
              >
                <span className="material-symbols-outlined text-base">
                  {t.icon}
                </span>
                {t.label}
              </button>
            ))}

            {/* Меню "..." */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="flex items-center gap-2 px-3 py-2.5 bg-[#1C1B1B] hover:bg-[#2A2A2A] border border-white/5 text-white/50 hover:text-white text-xs font-bold rounded-lg transition-all"
              >
                <span className="material-symbols-outlined text-base">
                  more_horiz
                </span>
              </button>
              {moreMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-[#1C1B1B] border border-white/10 rounded-xl shadow-xl z-50 w-52 py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-[#2A2A2A] transition-all text-left">
                    <span className="material-symbols-outlined text-base">
                      lock_reset
                    </span>
                    Сбросить пароль
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-[#2A2A2A] transition-all text-left">
                    <span className="material-symbols-outlined text-base">
                      notifications
                    </span>
                    Отправить уведомление
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-[#2A2A2A] transition-all text-left">
                    <span className="material-symbols-outlined text-base">
                      download
                    </span>
                    Экспорт данных
                  </button>
                  <div className="border-t border-white/5 my-1" />
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-all text-left">
                    <span className="material-symbols-outlined text-base">
                      delete
                    </span>
                    Удалить аккаунт
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Участий",
            value: stats.total_participations,
            sub: "за всё время",
            color: "text-white",
          },
          {
            label: "Побед",
            value: stats.wins,
            sub: "получено призов",
            color: "text-[#9caffc]",
          },
          {
            label: "Нарушений",
            value: stats.total_violations,
            sub: "за всё время",
            color:
              stats.total_violations > 0 ? "text-orange-400" : "text-green-400",
          },
          {
            label: "Активных нар.",
            value: stats.active_violations,
            sub: "прямо сейчас",
            color:
              stats.active_violations > 0 ? "text-red-400" : "text-green-400",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-[#111] border border-white/5 rounded-2xl p-5"
          >
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
              {item.label}
            </p>
            <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
            <p className="text-xs text-white/20 mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Табы */}
      <div className="flex gap-6 border-b border-white/5">
        {[
          { id: "prizes", label: "Розыгрыши и призы" },
          { id: "violations", label: "Нарушения" },
          { id: "activity", label: "Активность" },
          { id: "settings", label: "Настройки профиля" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${
              tab === t.id
                ? "text-[#9caffc] border-[#9caffc]"
                : "text-white/40 border-transparent hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Таб: Розыгрыши и призы */}
      {tab === "prizes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30 font-bold uppercase tracking-widest">
              {stats.total_participations} участий · {stats.wins} побед
            </p>
            <select
              value={prizeFilter}
              onChange={(e) => setPrizeFilter(e.target.value as any)}
              className="bg-[#111] border border-white/5 text-white/50 text-xs px-3 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="all">Все</option>
              <option value="wins">Победы</option>
              <option value="lost">Не победил</option>
            </select>
          </div>

          {filteredPrizes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">
                Призы
              </p>
              {filteredPrizes.map((p: any) => (
                <div
                  key={p.id}
                  className="bg-[#111] border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#1C1B1B] flex items-center justify-center flex-shrink-0">
                    <span
                      className={`material-symbols-outlined ${p.status === "cancelled" ? "text-white/20" : "text-[#9caffc]"}`}
                    >
                      {p.status === "cancelled" ? "close" : "emoji_events"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-white">
                        {p.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIZE_STATUS[p.status]?.color}`}
                      >
                        {PRIZE_STATUS[p.status]?.label}
                      </span>
                      {p.platform && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                          {PLATFORM_LABELS[p.platform] || p.platform}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-white/30">
                      {p.giveaway_title} · {p.created_at?.slice(0, 10)}
                    </span>
                  </div>
                  {p.status === "pending" && (
                    <button className="text-xs text-[#9caffc] hover:text-yellow-300 transition-colors font-bold uppercase tracking-widest flex-shrink-0">
                      Напомнить
                    </button>
                  )}
                  <button className="text-xs text-white/30 hover:text-white transition-colors font-bold uppercase tracking-widest flex-shrink-0">
                    Детали
                  </button>
                </div>
              ))}
            </div>
          )}

          {participations.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">
                Последние участия
              </p>
              <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Розыгрыш", "Платформа", "Участников", "Дата"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-[10px] font-bold text-white/30 uppercase tracking-widest"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {participations.map((p: any) => (
                      <tr
                        key={p.id}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3 text-white/70">
                          {p.giveaway_title}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                            {PLATFORM_LABELS[p.giveaway_platform] ||
                              p.giveaway_platform}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/40">
                          {p.participants_count}
                        </td>
                        <td className="px-4 py-3 text-white/40">
                          {p.joined_at?.slice(0, 10)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredPrizes.length === 0 && participations.length === 0 && (
            <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
              <p className="text-white/30 text-sm">
                Пользователь ещё не участвовал в розыгрышах
              </p>
            </div>
          )}
        </div>
      )}

      {/* Таб: Нарушения */}
      {tab === "violations" && (
        <div className="space-y-3">
          {violations.length === 0 ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
              <span
                className="material-symbols-outlined text-green-400 text-5xl block mb-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
              <p className="text-green-400 font-bold uppercase">
                Нарушений нет
              </p>
            </div>
          ) : (
            violations.map((v: any) => (
              <div
                key={v.id}
                className={`bg-[#111] border rounded-xl p-5 ${
                  v.is_active
                    ? "border-orange-500/20"
                    : "border-white/5 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase ${PUNISHMENT_COLOR[v.punishment_type]}`}
                    >
                      {v.punishment_type === "warning"
                        ? "Предупреждение"
                        : v.punishment_type === "mute"
                          ? "Мут"
                          : "Бан"}
                      {v.is_active && " · Активный"}
                    </span>
                    <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded-lg">
                      {v.platform || "Все платформы"}
                    </span>
                  </div>
                  <span className="text-xs text-white/30">
                    {v.created_at?.slice(0, 10)}
                  </span>
                </div>
                <p className="text-sm text-white mb-1">
                  {v.reason || "Нарушение правил"}
                </p>
                <p className="text-xs text-white/30">
                  Модератор: {v.moderator || "—"}
                  {v.expires_at && ` · до ${v.expires_at?.slice(0, 10)}`}
                </p>
                {v.is_active && (
                  <button
                    onClick={() => setRevokeId(v.id)}
                    className="mt-3 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest rounded-lg transition-all"
                  >
                    Отменить наказание
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Таб: Активность */}
      {tab === "activity" && (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center opacity-60">
          <span className="material-symbols-outlined text-white/20 text-5xl block mb-3">
            timeline
          </span>
          <p className="text-white/40 font-bold uppercase text-sm">
            Детальная активность
          </p>
          <p className="text-white/20 text-xs mt-1">
            Будет добавлена после интеграции с ботами
          </p>
        </div>
      )}

      {/* Таб: Настройки профиля */}
      {tab === "settings" && (
        <div className="space-y-4">
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-5">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Роль и статус
            </h3>

            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">
                Текущая роль
              </label>
              <div className="flex items-center gap-3">
                <span
                  className="text-sm font-bold px-3 py-1.5 rounded-lg"
                  style={
                    topRole
                      ? {
                          background: topRole.role.color + "20",
                          color: topRole.role.color,
                        }
                      : { color: "rgba(255,255,255,0.4)" }
                  }
                >
                  {topRole?.role.name || "Участник"}
                </span>
                <button className="text-xs text-[#9caffc] font-bold uppercase tracking-widest hover:underline">
                  Изменить роль
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">
                Заметка модератора
              </label>
              <textarea
                value={roleForm.note}
                onChange={(e) =>
                  setRoleForm((f) => ({ ...f, note: e.target.value }))
                }
                placeholder="Внутренняя заметка видна только модераторам..."
                rows={3}
                className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none resize-none text-sm"
              />
            </div>

            <div className="pt-2">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">
                Информация
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Зарегистрирован</span>
                  <span className="text-white">
                    {user.created_at?.slice(0, 10)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">UUID</span>
                  <span className="text-white/50 font-mono text-xs">
                    {user.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Email</span>
                  <span className="text-white/70">{user.email || "—"}</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-[#1C1B1B] hover:bg-[#2A2A2A] border border-white/5 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all">
              Сохранить изменения
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
