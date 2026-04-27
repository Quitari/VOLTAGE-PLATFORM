import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../../api/client";

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "Открыт", color: "text-[#9caffc]", bg: "bg-[#9caffc]/10" },
  in_work: {
    label: "В работе",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  waiting: {
    label: "Ожидает",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  closed: { label: "Закрыт", color: "text-white/40", bg: "bg-white/5" },
};

const CATEGORY: Record<string, string> = {
  general: "Общий вопрос",
  prize: "Проблема с призом",
  punishment: "Наказание",
  bug: "Ошибка на сайте",
  other: "Другое",
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    client
      .get(`/moderation/tickets/${id}/`)
      .then((r) => setTicket(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  const handleSend = async () => {
    if (!reply.trim()) return;
    setSending(true);
    setError("");
    try {
      await client.post(`/moderation/tickets/${id}/reply/`, { text: reply });
      setReply("");
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Ошибка отправки");
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      await client.post(`/moderation/tickets/${id}/close/`);
      load();
    } catch {
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-[#111] rounded-xl animate-pulse w-64" />
        <div className="h-64 bg-[#111] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-2xl">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-12 text-center">
          <p className="text-red-400 font-black text-xl uppercase">
            Тикет не найден
          </p>
          <button
            onClick={() => navigate("/dashboard/tickets")}
            className="mt-4 text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest"
          >
            ← Назад к тикетам
          </button>
        </div>
      </div>
    );
  }

  const s = STATUS[ticket.status] || STATUS.open;
  const isClosed = ticket.status === "closed";

  return (
    <div className="space-y-5">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard/tickets")}
          className="w-9 h-9 rounded-xl bg-[#111] border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-base">
            arrow_back
          </span>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black uppercase tracking-tight text-white truncate">
            {ticket.subject}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-white/30">
              {CATEGORY[ticket.category] || "Другое"}
            </span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/30">
              {new Date(ticket.created_at).toLocaleDateString("ru-RU")}
            </span>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-xl text-xs font-bold uppercase flex-shrink-0 ${s.bg} ${s.color}`}
        >
          {s.label}
        </div>
      </div>

      {/* Сообщения */}
      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <div className="min-h-[400px] max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {ticket.messages?.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-8">
              Нет сообщений
            </p>
          ) : (
            ticket.messages?.map((msg: any) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.is_staff ? "" : "flex-row-reverse"}`}
              >
                {/* Аватар */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black ${
                    msg.is_staff
                      ? "bg-[#9caffc]/20 text-[#9caffc]"
                      : "bg-white/5 text-white/60"
                  }`}
                >
                  {msg.is_staff ? (
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      shield_person
                    </span>
                  ) : (
                    (typeof msg.author === "string"
                      ? msg.author
                      : msg.author?.username || "??"
                    )
                      ?.slice(0, 2)
                      .toUpperCase()
                  )}
                </div>

                {/* Сообщение */}
                <div
                  className={`max-w-[75%] ${msg.is_staff ? "" : "items-end"} flex flex-col gap-1`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm ${
                      msg.is_staff
                        ? "bg-[#9caffc]/10 border border-[#9caffc]/20 text-white/80 rounded-tl-sm"
                        : "bg-[#1C1B1B] border border-white/5 text-white/80 rounded-tr-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-white/20 px-1">
                    {new Date(msg.created_at).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    ·{" "}
                    {typeof msg.author === "string"
                      ? msg.author
                      : msg.author?.username}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Поле ввода */}
        {!isClosed && (
          <div className="border-t border-white/5 p-4">
            {error && <p className="text-red-400 text-xs mb-2">⚠️ {error}</p>}
            <div className="flex gap-3">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Напиши сообщение... (Enter для отправки)"
                rows={2}
                className="flex-1 bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 resize-none placeholder-white/20"
              />
              <button
                onClick={handleSend}
                disabled={sending || !reply.trim()}
                className="w-12 h-full bg-[#9caffc] text-[#0a0a0a] rounded-xl flex items-center justify-center hover:bg-[#7b94f8] transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-base">
                  send
                </span>
              </button>
            </div>
          </div>
        )}

        {isClosed && (
          <div className="border-t border-white/5 p-4 text-center">
            <p className="text-white/30 text-xs uppercase tracking-widest">
              Тикет закрыт
            </p>
          </div>
        )}
      </div>

      {/* Кнопка закрытия */}
      {!isClosed && (
        <button
          onClick={handleClose}
          disabled={closing}
          className="text-xs font-bold text-white/20 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">close</span>
          {closing ? "Закрываем..." : "Закрыть тикет"}
        </button>
      )}
    </div>
  );
}
