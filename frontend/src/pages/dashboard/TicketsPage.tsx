import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";

const STATUS: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  open: {
    label: "Открыт",
    color: "text-[#0000CD]",
    bg: "bg-[#0000CD]/10",
    border: "border-[#0000CD]/20",
  },
  in_work: {
    label: "В работе",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
  },
  waiting: {
    label: "Ожидает",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
  },
  closed: {
    label: "Закрыт",
    color: "text-white/40",
    bg: "bg-white/5",
    border: "border-white/10",
  },
};

const CATEGORY: Record<string, { label: string; icon: string }> = {
  general: { label: "Общий вопрос", icon: "help" },
  prize: { label: "Проблема с призом", icon: "redeem" },
  punishment: { label: "Наказание", icon: "gavel" },
  bug: { label: "Ошибка на сайте", icon: "bug_report" },
  other: { label: "Другое", icon: "more_horiz" },
};

export default function TicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    category: "general",
    first_message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  const load = () => {
    setLoading(true);
    client
      .get("/moderation/tickets/?my=true")
      .then((r) => setTickets(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async () => {
    if (!form.subject.trim()) {
      setError("Укажи тему");
      return;
    }
    if (!form.first_message.trim() || form.first_message.length < 10) {
      setError("Сообщение слишком короткое");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await client.post("/moderation/tickets/", form);
      setShowForm(false);
      setForm({ subject: "", category: "general", first_message: "" });
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = tickets.filter((t) => {
    if (filter === "open") return t.status !== "closed";
    if (filter === "closed") return t.status === "closed";
    return true;
  });

  const openCount = tickets.filter((t) => t.status !== "closed").length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Заголовок */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
            Тике<span className="text-[#0000CD]">ты</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">Обращения в поддержку</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0000CD] text-white font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-[#1A1AE8] transition-colors"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Новый тикет
        </button>
      </div>

      {/* Форма создания */}
      {showForm && (
        <div className="bg-[#111] border border-[#0000CD]/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-tight">
            Новое обращение
          </h3>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                Тема *
              </label>
              <input
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                placeholder="Кратко опиши проблему"
                className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#0000CD]/40"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                Категория
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#0000CD]/40"
              >
                {Object.entries(CATEGORY).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
              Сообщение *
            </label>
            <textarea
              value={form.first_message}
              onChange={(e) =>
                setForm((f) => ({ ...f, first_message: e.target.value }))
              }
              placeholder="Опиши проблему подробно..."
              rows={4}
              className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#0000CD]/40 resize-none placeholder-white/20"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
              className="flex-1 py-3 bg-[#1C1B1B] text-white/60 font-bold rounded-xl uppercase text-xs hover:bg-[#2A2A2A] transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 bg-[#0000CD] text-white font-bold rounded-xl uppercase text-xs hover:bg-[#1A1AE8] transition-colors disabled:opacity-40"
            >
              {submitting ? "Отправляем..." : "Отправить"}
            </button>
          </div>
        </div>
      )}

      {/* Фильтры */}
      {!loading && tickets.length > 0 && (
        <div className="flex items-center gap-1 bg-[#111] border border-white/5 rounded-xl p-1 w-fit">
          {[
            { key: "all", label: "Все", count: tickets.length },
            { key: "open", label: "Открытые", count: openCount },
            {
              key: "closed",
              label: "Закрытые",
              count: tickets.length - openCount,
            },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                filter === f.key
                  ? "bg-[#0000CD] text-white"
                  : "text-white/40 hover:text-white"
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                    filter === f.key
                      ? "bg-white/20"
                      : "bg-white/5 text-white/40"
                  }`}
                >
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Список тикетов */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#111] border border-white/5 rounded-2xl h-20 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-white/10 text-6xl block mb-4">
            support_agent
          </span>
          <p className="text-white/40 font-bold uppercase text-lg">
            {filter === "open"
              ? "Открытых тикетов нет"
              : filter === "closed"
                ? "Закрытых тикетов нет"
                : "Тикетов пока нет"}
          </p>
          <p className="text-white/20 text-sm mt-2">
            Создай новое обращение если нужна помощь
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const s = STATUS[t.status] || STATUS.open;
            const cat = CATEGORY[t.category] || CATEGORY.other;
            return (
              <button
                key={t.id}
                onClick={() => navigate(`/dashboard/tickets/${t.id}`)}
                className="w-full bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:bg-[#141414] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1C1B1B] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white/30 text-base">
                    {cat.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">
                    {t.subject}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {cat.label} ·{" "}
                    {new Date(t.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-xl text-xs font-bold uppercase flex-shrink-0 ${s.bg} ${s.color}`}
                >
                  {s.label}
                </div>
                <span className="material-symbols-outlined text-white/20 text-base flex-shrink-0">
                  chevron_right
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
