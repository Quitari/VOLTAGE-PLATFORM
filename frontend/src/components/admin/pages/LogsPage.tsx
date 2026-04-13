import { useEffect, useState } from "react";
import { moderationApi } from "../../../api/moderation";

const ACTION_LABELS: Record<string, string> = {
  "user.register": "Регистрация",
  "user.login": "Вход",
  "user.logout": "Выход",
  "user.ban": "Блокировка",
  "role.assign": "Назначение роли",
  "role.revoke": "Снятие роли",
  "giveaway.create": "Создание розыгрыша",
  "giveaway.draw": "Подведение итогов",
  "giveaway.cancel": "Отмена розыгрыша",
  "punishment.issue": "Выдача наказания",
  "punishment.revoke": "Отмена наказания",
  "appeal.resolve": "Решение апелляции",
  "settings.change": "Изменение настроек",
  "role.create": "Создание роли",
  "role.delete": "Удаление роли",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = (user = "") => {
    setLoading(true);
    moderationApi
      .audit({ user })
      .then((res) => setLogs(res.data))
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

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
            ЖУРНАЛ АУДИТА
          </h1>
          <p className="text-white/40 text-sm mt-1">Записей: {logs.length}</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по нику..."
            className="bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#FFE100]/40 w-64"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#FFE100] text-[#211C00] font-bold text-xs rounded-xl uppercase tracking-widest"
          >
            Найти
          </button>
        </form>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#1C1B1B]">
              {["Кто", "Действие", "Над кем", "IP", "Время"].map((h) => (
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
                  colSpan={5}
                  className="px-6 py-8 text-center text-white/40 text-sm"
                >
                  Загрузка...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-white/40 text-sm"
                >
                  Нет записей
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white">
                      {log.actor?.username || "—"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold bg-white/5 text-white/60 px-2 py-1 rounded-full">
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60">
                    {log.target_user?.username || "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-white/40 font-mono">
                    {log.ip_address || "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-white/40">
                    {log.created_at?.slice(0, 16).replace("T", " ")}
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
