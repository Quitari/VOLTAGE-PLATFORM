import { useEffect, useState } from "react";
import { moderationApi } from "../../../api/moderation";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  warning: {
    label: "Предупреждение",
    color: "bg-yellow-500/15 text-yellow-400",
  },
  mute: { label: "Мут", color: "bg-orange-500/15 text-orange-400" },
  ban: { label: "Бан", color: "bg-red-500/15 text-red-400" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Активно", color: "bg-red-500/15 text-red-400" },
  revoked: { label: "Отменено", color: "bg-white/10 text-white/40" },
  expired: { label: "Истекло", color: "bg-white/10 text-white/40" },
};

export default function ModerationPage() {
  const [punishments, setPunishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = (status = "active") => {
    setLoading(true);
    moderationApi
      .punishments({ status })
      .then((res) => setPunishments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter]);

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await moderationApi.revoke(id);
      setConfirmId(null);
      load(statusFilter);
    } catch (err: any) {
      alert(err.response?.data?.error || "Ошибка");
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
            МОДЕРАЦИЯ
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Наказаний: {punishments.length}
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-white/5">
        {["active", "revoked", "expired"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`pb-3 px-4 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${
              statusFilter === s
                ? "text-[#FFE100] border-[#FFE100]"
                : "text-white/40 border-transparent hover:text-white"
            }`}
          >
            {STATUS_LABELS[s]?.label}
          </button>
        ))}
      </div>

      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#1C1B1B]">
              {[
                "Пользователь",
                "Тип",
                "Платформа",
                "Причина",
                "Выдал",
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
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${type?.color}`}
                      >
                        {type?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/60">
                      {p.platform}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/60 max-w-[200px] truncate">
                      {p.reason}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40">
                      {p.issued_by?.username || "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40">
                      {p.issued_at?.slice(0, 10)}
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
