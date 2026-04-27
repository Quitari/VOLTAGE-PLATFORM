import { useEffect, useState, useRef } from "react";
import { moderationApi } from "../../../api/moderation";
import client from "../../../api/client";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  warning: {
    label: "Предупреждение",
    color: "bg-yellow-500/15 text-yellow-400",
  },
  mute: { label: "Мут", color: "bg-orange-500/15 text-orange-400" },
  ban: { label: "Бан", color: "bg-red-500/15 text-red-400" },
};

const STATUS_LABELS: Record<string, string> = {
  active: "Активные",
  revoked: "Отменённые",
  expired: "Истекшие",
};

const PLATFORMS = [
  { value: "all", label: "Все платформы" },
  { value: "telegram", label: "Telegram" },
  { value: "twitch", label: "Twitch" },
  { value: "site", label: "Сайт" },
];

const PUNISHMENT_TYPES = [
  { value: "warning", label: "Предупреждение" },
  { value: "mute", label: "Мут" },
  { value: "ban", label: "Бан" },
];

export default function ModerationPage() {
  const [punishments, setPunishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Быстрое наказание
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [punishType, setPunishType] = useState("warning");
  const [punishPlatforms, setPunishPlatforms] = useState<string[]>(["all"]);
  const [punishReason, setPunishReason] = useState("");
  const [punishExpires, setPunishExpires] = useState("");
  const [punishing, setPunishing] = useState(false);
  const [punishError, setPunishError] = useState("");
  const [punishSuccess, setPunishSuccess] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  const load = (s = "active") => {
    setLoading(true);
    moderationApi
      .punishments({ status: s })
      .then((res) => setPunishments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter]);

  // Поиск пользователя
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      setSearchLoading(true);
      const cleanSearch = search.startsWith("@") ? search.slice(1) : search;
      client
        .get(`/auth/list/?search=${encodeURIComponent(cleanSearch)}`)
        .then((r) => setSearchResults(r.data.slice(0, 5)))
        .catch(() => {})
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const selectUser = (u: any) => {
    setSelectedUser(u);
    setSearch(u.username);
    setSearchResults([]);
  };

  const togglePlatform = (val: string) => {
    if (val === "all") {
      setPunishPlatforms(["all"]);
      return;
    }
    setPunishPlatforms((prev) => {
      const without = prev.filter((p) => p !== "all");
      if (without.includes(val)) {
        const next = without.filter((p) => p !== val);
        return next.length ? next : ["all"];
      }
      return [...without, val];
    });
  };

  const handlePunish = async () => {
    if (!selectedUser) {
      setPunishError("Выбери пользователя");
      return;
    }
    if (!punishReason.trim()) {
      setPunishError("Укажи причину");
      return;
    }
    setPunishing(true);
    setPunishError("");
    setPunishSuccess("");
    try {
      const platform = punishPlatforms.includes("all")
        ? "all"
        : punishPlatforms[0];
      await moderationApi.punish(selectedUser.id, {
        punishment_type: punishType,
        platform,
        reason: punishReason,
        expires_at: punishExpires || undefined,
      });
      setPunishSuccess(`Наказание выдано: ${selectedUser.username}`);
      setSelectedUser(null);
      setSearch("");
      setPunishReason("");
      setPunishExpires("");
      setPunishType("warning");
      setPunishPlatforms(["all"]);
      load(statusFilter);
      setTimeout(() => setPunishSuccess(""), 4000);
    } catch (err: any) {
      setPunishError(err.response?.data?.error || "Ошибка");
    } finally {
      setPunishing(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await moderationApi.revoke(id);
      setConfirmId(null);
      load(statusFilter);
    } catch (err: any) {
      setPunishError(err.response?.data?.error || "Ошибка отмены");
    } finally {
      setRevoking(null);
    }
  };

  const activeBans = punishments.filter(
    (p) => p.punishment_type === "ban",
  ).length;
  const activeMutes = punishments.filter(
    (p) => p.punishment_type === "mute",
  ).length;
  const activeWarnings = punishments.filter(
    (p) => p.punishment_type === "warning",
  ).length;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
            НАКАЗАНИЯ
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Контроль и мониторинг санкций в реальном времени
          </p>
        </div>
        {statusFilter === "active" && (
          <div className="flex gap-3">
            <div className="px-4 py-2 bg-[#1C1B1B] rounded-xl border-l-4 border-green-500">
              <p className="text-[10px] text-white/40 uppercase font-bold">
                Предупреждений
              </p>
              <p className="text-xl font-black text-white">{activeWarnings}</p>
            </div>
            <div className="px-4 py-2 bg-[#1C1B1B] rounded-xl border-l-4 border-orange-500">
              <p className="text-[10px] text-white/40 uppercase font-bold">
                Мутов
              </p>
              <p className="text-xl font-black text-white">{activeMutes}</p>
            </div>
            <div className="px-4 py-2 bg-[#1C1B1B] rounded-xl border-l-4 border-red-500">
              <p className="text-[10px] text-white/40 uppercase font-bold">
                Банов
              </p>
              <p className="text-xl font-black text-white">{activeBans}</p>
            </div>
          </div>
        )}
      </div>

      {/* Блок быстрого наказания */}
      <section className="bg-[#111] border border-white/5 rounded-2xl p-6">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-5">
          Быстрое наказание
        </h3>

        {punishError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
            ⚠️ {punishError}
          </div>
        )}
        {punishSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl mb-4">
            ✅ {punishSuccess}
          </div>
        )}

        <div className="space-y-4">
          {/* Поиск пользователя */}
          <div>
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">
              Пользователь
            </label>
            <div className="relative" ref={searchRef}>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-base">
                search
              </span>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedUser(null);
                }}
                placeholder="Ник на сайте, @Telegram, Twitch ник..."
                className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:border-[#0000CD]/40"
              />
              {/* Результаты поиска */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1C1B1B] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => selectUser(u)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2A2A2A] transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#111] flex items-center justify-center font-bold text-[#0000CD] text-xs flex-shrink-0">
                        {u.username?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">
                          {u.username}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {u.email && (
                            <span className="text-xs text-white/30">
                              {u.email}
                            </span>
                          )}
                          {u.telegram_username && (
                            <span className="text-xs text-[#24A1DE]/70">
                              @{u.telegram_username}
                            </span>
                          )}
                          {u.twitch_username && (
                            <span className="text-xs text-[#9146FF]/70">
                              twitch: {u.twitch_username}
                            </span>
                          )}
                          {!u.telegram_username && !u.twitch_username && (
                            <span className="text-xs text-white/20">
                              нет привязок
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchLoading && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1C1B1B] border border-white/10 rounded-xl p-3 text-center text-white/40 text-xs">
                  Поиск...
                </div>
              )}
            </div>
            {selectedUser && (
              <div className="mt-2 bg-[#1C1B1B] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center font-bold text-[#0000CD] text-sm">
                    {selectedUser.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {selectedUser.username}
                    </p>
                    <p className="text-xs text-white/40">
                      ID: {selectedUser.id?.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                  Платформы для наказания
                </div>
                <div className="flex gap-2 flex-wrap">
                  {PLATFORMS.map((pl) => (
                    <label
                      key={pl.value}
                      className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                        punishPlatforms.includes(pl.value)
                          ? "bg-[#0000CD]/10 border-[#0000CD]/30 text-[#0000CD]"
                          : "bg-[#111] border-white/10 text-white/40 hover:text-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={punishPlatforms.includes(pl.value)}
                        onChange={() => togglePlatform(pl.value)}
                      />
                      {pl.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Тип + причина + кнопка */}
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-shrink-0">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">
                Тип наказания
              </label>
              <div className="flex bg-[#1C1B1B] border border-white/5 p-1 rounded-xl gap-1">
                {PUNISHMENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setPunishType(t.value)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-widest transition-all ${
                      punishType === t.value
                        ? "bg-[#0000CD] text-[#FFFFFF]"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-48">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">
                Причина
              </label>
              <input
                value={punishReason}
                onChange={(e) => setPunishReason(e.target.value)}
                placeholder="Укажите причину..."
                className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm py-2.5 px-4 rounded-xl focus:outline-none focus:border-[#0000CD]/40"
              />
            </div>

            <div className="flex-shrink-0">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">
                Срок (необязательно)
              </label>
              <input
                type="datetime-local"
                value={punishExpires}
                onChange={(e) => setPunishExpires(e.target.value)}
                className="bg-[#1C1B1B] border border-white/5 text-white text-sm py-2.5 px-4 rounded-xl focus:outline-none focus:border-[#0000CD]/40"
              />
            </div>

            <button
              onClick={handlePunish}
              disabled={punishing || !selectedUser}
              className="px-6 py-2.5 bg-[#0000CD] text-[#FFFFFF] font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#1A1AE8] transition-all active:scale-95 flex items-center gap-2 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">gavel</span>
              {punishing ? "Выдаём..." : "Выдать наказание"}
            </button>
          </div>
          <p className="text-[10px] text-white/20">
            Наказание будет применено на всех отмеченных платформах одновременно
          </p>
        </div>
      </section>

      {/* Табы */}
      <div className="flex gap-1 border-b border-white/5">
        {(["active", "revoked", "expired"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`pb-3 px-4 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${
              statusFilter === s
                ? "text-[#0000CD] border-[#0000CD]"
                : "text-white/40 border-transparent hover:text-white"
            }`}
          >
            {STATUS_LABELS[s]}
            {s === "active" &&
              punishments.length > 0 &&
              statusFilter === "active" && (
                <span className="ml-2 text-[9px] bg-[#0000CD]/15 text-[#0000CD] px-1.5 py-0.5 rounded-full">
                  {punishments.length}
                </span>
              )}
          </button>
        ))}
      </div>

      {/* Таблица */}
      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#1C1B1B]">
              {[
                "Пользователь",
                "Тип",
                "Причина",
                "Выдал",
                "Выдано",
                "Истекает",
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
            ) : punishments.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-white/40 text-sm"
                >
                  Нет наказаний
                </td>
              </tr>
            ) : (
              punishments.map((p) => {
                const type = TYPE_LABELS[p.punishment_type];
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">
                        {p.user?.username || "—"}
                      </p>
                      <p className="text-xs text-white/30">{p.platform}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${type?.color}`}
                      >
                        {type?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/60 max-w-[180px] truncate">
                      {p.reason}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40">
                      {p.issued_by?.username || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40">
                      {p.issued_at?.slice(0, 10)}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40">
                      {p.expires_at ? (
                        <span
                          className={
                            new Date(p.expires_at) < new Date()
                              ? "text-red-400/60"
                              : "text-white/40"
                          }
                        >
                          {new Date(p.expires_at).toLocaleDateString("ru-RU")}
                        </span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.status === "active" &&
                        (confirmId === p.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/60">
                              Уверен?
                            </span>
                            <button
                              onClick={() => handleRevoke(p.id)}
                              disabled={revoking === p.id}
                              className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                              {revoking === p.id ? "..." : "Да"}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="px-2 py-1 bg-white/10 text-white/40 text-xs font-bold rounded-lg hover:bg-white/20 transition-colors"
                            >
                              Нет
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmId(p.id)}
                            className="px-3 py-1.5 bg-red-500/15 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/25 transition-colors"
                          >
                            Отменить
                          </button>
                        ))}
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
