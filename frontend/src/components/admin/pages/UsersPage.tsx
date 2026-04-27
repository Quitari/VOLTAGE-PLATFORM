import { useEffect, useState } from "react";
import { authApi } from "../../../api/auth";
import { moderationApi } from "../../../api/moderation";
import type { User } from "../../../types";
import { useNavigate } from "react-router-dom";

const PUNISHMENT_TYPES = [
  { value: "warning", label: "⚠️ Предупреждение" },
  { value: "mute", label: "🔇 Мут" },
  { value: "ban", label: "🔨 Бан" },
];

const PLATFORMS = [
  { value: "all", label: "Все платформы" },
  { value: "telegram", label: "Telegram" },
  { value: "twitch", label: "Twitch" },
  { value: "site", label: "Сайт" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Модалка наказания
  const [punishUser, setPunishUser] = useState<User | null>(null);
  const [punishForm, setPunishForm] = useState({
    punishment_type: "warning",
    platform: "all",
    reason: "",
    expires_at: "",
  });
  const [punishing, setPunishing] = useState(false);
  const [punishError, setPunishError] = useState("");
  const navigate = useNavigate();

  const load = (s = "") => {
    setLoading(true);
    authApi
      .userList({ search: s })
      .then((res) => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search);
  };

  const openPunish = (user: User) => {
    setPunishUser(user);
    setPunishForm({
      punishment_type: "warning",
      platform: "all",
      reason: "",
      expires_at: "",
    });
    setPunishError("");
  };

  const handlePunish = async () => {
    if (!punishUser || !punishForm.reason.trim()) {
      setPunishError("Укажи причину");
      return;
    }
    setPunishing(true);
    setPunishError("");
    try {
      await moderationApi.punish(punishUser.id, {
        punishment_type: punishForm.punishment_type,
        platform: punishForm.platform,
        reason: punishForm.reason,
        expires_at: punishForm.expires_at || undefined,
      });
      setPunishUser(null);
      load(search);
    } catch (err: any) {
      setPunishError(err.response?.data?.error || "Ошибка");
    } finally {
      setPunishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Модалка наказания */}
      {punishUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Наказание
              </h3>
              <button
                onClick={() => setPunishUser(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-[#1C1B1B] rounded-xl px-4 py-3">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">
                Пользователь
              </p>
              <p className="text-white font-bold">{punishUser.username}</p>
            </div>

            {punishError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                ⚠️ {punishError}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                Тип наказания
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PUNISHMENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() =>
                      setPunishForm((p) => ({ ...p, punishment_type: t.value }))
                    }
                    className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                      punishForm.punishment_type === t.value
                        ? "bg-[#0000CD] text-[#FFFFFF]"
                        : "bg-[#1C1B1B] text-white/60 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                Платформа
              </label>
              <select
                value={punishForm.platform}
                onChange={(e) =>
                  setPunishForm((p) => ({ ...p, platform: e.target.value }))
                }
                className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#0000CD]/40"
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
                placeholder="Укажи причину наказания..."
                rows={3}
                className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#0000CD]/40 resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                Срок истечения (необязательно)
              </label>
              <input
                type="datetime-local"
                value={punishForm.expires_at}
                onChange={(e) =>
                  setPunishForm((p) => ({ ...p, expires_at: e.target.value }))
                }
                className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#0000CD]/40"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPunishUser(null)}
                className="flex-1 py-3 bg-[#1C1B1B] text-white/60 font-bold rounded-xl uppercase tracking-widest text-xs hover:bg-[#2A2A2A] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handlePunish}
                disabled={punishing}
                className="flex-1 py-3 bg-red-500/20 text-red-400 font-bold rounded-xl uppercase tracking-widest text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {punishing ? "Выдаём..." : "🔨 Выдать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Заголовок */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
            ПОЛЬЗОВАТЕЛИ
          </h1>
          <p className="text-white/40 text-sm mt-1">Всего: {users.length}</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по нику..."
            className="bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#0000CD]/40 w-64"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#0000CD] text-[#FFFFFF] font-bold text-xs rounded-xl uppercase tracking-widest"
          >
            Найти
          </button>
        </form>
      </div>

      {/* Таблица */}
      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#1C1B1B]">
              {[
                "Пользователь",
                "Роль",
                "Статус",
                "Telegram",
                "Twitch",
                "Steam",
                "Дата",
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
                  colSpan={8}
                  className="px-6 py-8 text-center text-white/40 text-sm"
                >
                  Загрузка...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-white/40 text-sm"
                >
                  Пользователи не найдены
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1C1B1B] flex items-center justify-center text-[#0000CD] font-bold text-xs flex-shrink-0">
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {user.username}
                        </p>
                        <p className="text-xs text-white/40">
                          {user.email || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.roles?.length
                      ? (() => {
                          const top = user.roles.reduce((p, c) =>
                            c.role.level > p.role.level ? c : p,
                          );
                          return (
                            <span
                              className="text-xs font-bold px-2 py-1 rounded-full"
                              style={{
                                background: top.role.color + "20",
                                color: top.role.color,
                              }}
                            >
                              {top.role.name}
                            </span>
                          );
                        })()
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        user.status === "active"
                          ? "bg-green-500/15 text-green-400"
                          : user.status === "banned"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-white/10 text-white/40"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60">
                    {user.telegram_username
                      ? `@${user.telegram_username}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60">
                    {user.twitch_username || "—"}
                  </td>
                  <td className="px-6 py-4">
                    {user.has_steam ? (
                      <span className="text-green-400 text-xs">✓</span>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-white/40">
                    {user.created_at.slice(0, 10)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                        className="px-3 py-1.5 bg-[#1C1B1B] border border-white/5 text-white/60 text-xs font-bold rounded-lg hover:text-white hover:bg-[#2A2A2A] transition-colors"
                      >
                        Профиль
                      </button>
                      <button
                        onClick={() => openPunish(user)}
                        className="px-3 py-1.5 bg-red-500/10 text-red-400/70 text-xs font-bold rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      >
                        Наказать
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
