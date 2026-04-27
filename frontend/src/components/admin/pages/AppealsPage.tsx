import { useEffect, useState } from "react";
import { moderationApi } from "../../../api/moderation";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: {
    label: "На рассмотрении",
    color: "bg-yellow-500/15 text-yellow-400",
  },
  approved: { label: "Одобрена", color: "bg-green-500/15 text-green-400" },
  rejected: { label: "Отклонена", color: "bg-red-500/15 text-red-400" },
  clarify: { label: "Уточнение", color: "bg-blue-500/15 text-blue-400" },
};

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [response, setResponse] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  const load = (status = "pending") => {
    setLoading(true);
    moderationApi
      .appeals({ status })
      .then((res) => setAppeals(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter]);

  const handleResolve = async (decision: string) => {
    if (!selected) return;
    try {
      await moderationApi.resolveAppeal(selected.id, {
        decision,
        response,
      });
      setSelected(null);
      setResponse("");
      load(statusFilter);
    } catch (err: any) {
      alert(err.response?.data?.error || "Ошибка");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
        АПЕЛЛЯЦИИ
      </h1>

      <div className="flex gap-1 border-b border-white/5">
        {["pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`pb-3 px-4 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${
              statusFilter === s
                ? "text-[#9caffc] border-[#9caffc]"
                : "text-white/40 border-transparent hover:text-white"
            }`}
          >
            {STATUS_LABELS[s]?.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Список */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
          {loading ? (
            <p className="p-6 text-white/40 text-sm">Загрузка...</p>
          ) : appeals.length === 0 ? (
            <p className="p-6 text-white/40 text-sm">Нет апелляций</p>
          ) : (
            appeals.map((a) => {
              const st = STATUS_LABELS[a.status];
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelected(a);
                    setResponse("");
                  }}
                  className={`w-full text-left px-5 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                    selected?.id === a.id ? "bg-white/[0.04]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-white">
                      {a.user?.username}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st?.color}`}
                    >
                      {st?.label}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 truncate">{a.text}</p>
                  <p className="text-xs text-white/20 mt-1">
                    Наказание: {a.punishment?.punishment_type} ·{" "}
                    {a.created_at?.slice(0, 10)}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Детали */}
        <div className="bg-[#111] border border-white/5 rounded-2xl flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <p className="text-white/20 text-sm">Выбери апелляцию</p>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                  Пользователь
                </p>
                <p className="text-white font-bold">
                  {selected.user?.username}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                  Наказание
                </p>
                <p className="text-white/60 text-sm">
                  {selected.punishment?.punishment_type} ·{" "}
                  {selected.punishment?.reason}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                  Текст апелляции
                </p>
                <p className="text-white/80 text-sm bg-[#1C1B1B] rounded-xl px-4 py-3">
                  {selected.text}
                </p>
              </div>

              {selected.status === "pending" && (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                      Ответ модератора
                    </label>
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Напиши ответ пользователю..."
                      rows={3}
                      className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve("approved")}
                      className="flex-1 py-2.5 bg-green-500/15 text-green-400 font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-green-500/25 transition-colors"
                    >
                      ✅ Одобрить
                    </button>
                    <button
                      onClick={() => handleResolve("rejected")}
                      className="flex-1 py-2.5 bg-red-500/15 text-red-400 font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-red-500/25 transition-colors"
                    >
                      ❌ Отклонить
                    </button>
                  </div>
                </>
              )}

              {selected.moderator_response && (
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                    Ответ модератора
                  </p>
                  <p className="text-white/80 text-sm bg-[#9caffc]/10 border border-[#9caffc]/20 rounded-xl px-4 py-3">
                    {selected.moderator_response}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
