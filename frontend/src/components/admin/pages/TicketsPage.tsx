import { useEffect, useState } from "react";
import { moderationApi } from "../../../api/moderation";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: "Открыт", color: "bg-green-500/15 text-green-400" },
  in_work: { label: "В работе", color: "bg-blue-500/15 text-blue-400" },
  waiting: { label: "Ожидает", color: "bg-yellow-500/15 text-yellow-400" },
  closed: { label: "Закрыт", color: "bg-white/10 text-white/40" },
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "Общий",
  prize: "Приз",
  punishment: "Наказание",
  bug: "Ошибка",
  other: "Другое",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [reply, setReply] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");

  const load = (status = "open") => {
    setLoading(true);
    moderationApi
      .tickets({ status })
      .then((res) => setTickets(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter]);

  const openTicket = async (id: string) => {
    try {
      const res = await moderationApi.ticketDetail(id);
      setSelected(res.data);
      setReply("");
    } catch {}
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    try {
      await moderationApi.ticketReply(selected.id, reply);
      setReply("");
      const res = await moderationApi.ticketDetail(selected.id);
      setSelected(res.data);
      load(statusFilter);
    } catch {}
  };

  const handleClose = async () => {
    if (!selected) return;
    try {
      await moderationApi.ticketClose(selected.id);
      setSelected(null);
      load(statusFilter);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
        ТИКЕТЫ
      </h1>

      <div className="flex gap-1 border-b border-white/5">
        {["open", "in_work", "waiting", "closed"].map((s) => (
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
          ) : tickets.length === 0 ? (
            <p className="p-6 text-white/40 text-sm">Нет тикетов</p>
          ) : (
            tickets.map((t) => {
              const st = STATUS_LABELS[t.status];
              return (
                <button
                  key={t.id}
                  onClick={() => openTicket(t.id)}
                  className={`w-full text-left px-5 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                    selected?.id === t.id ? "bg-white/[0.04]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold text-white truncate flex-1 mr-2">
                      {t.subject}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${st?.color}`}
                    >
                      {st?.label}
                    </span>
                  </div>
                  <p className="text-xs text-white/40">
                    {t.user?.username} · {CATEGORY_LABELS[t.category]} ·{" "}
                    {t.created_at?.slice(0, 10)}
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
              <p className="text-white/20 text-sm">Выбери тикет</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm">
                    {selected.subject}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {selected.user?.username} ·{" "}
                    {CATEGORY_LABELS[selected.category]}
                  </p>
                </div>
                {selected.status !== "closed" && (
                  <button
                    onClick={handleClose}
                    className="px-3 py-1.5 bg-red-500/15 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/25 transition-colors"
                  >
                    Закрыть
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
                {selected.messages?.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl px-4 py-3 text-sm ${
                      msg.is_staff
                        ? "bg-[#9caffc]/10 border border-[#9caffc]/20 ml-4"
                        : "bg-[#1C1B1B] mr-4"
                    }`}
                  >
                    <p className="text-[10px] font-bold text-white/40 mb-1 uppercase tracking-widest">
                      {msg.author?.username} {msg.is_staff ? "· Модератор" : ""}
                    </p>
                    <p className="text-white/80">{msg.text}</p>
                  </div>
                ))}
              </div>

              {selected.status !== "closed" && (
                <div className="p-4 border-t border-white/5 flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Напиши ответ..."
                    className="flex-1 bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                    onKeyDown={(e) => e.key === "Enter" && handleReply()}
                  />
                  <button
                    onClick={handleReply}
                    className="px-4 py-2.5 bg-[#9caffc] text-[#0a0a0a] font-bold text-xs rounded-xl uppercase"
                  >
                    Ответить
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
