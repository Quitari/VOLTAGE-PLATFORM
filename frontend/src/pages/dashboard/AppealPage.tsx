import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../../api/client";

const TYPE: Record<string, { label: string; color: string; icon: string }> = {
  warning: { label: "Предупреждение", color: "text-yellow-400", icon: "warning" },
  mute: { label: "Мут", color: "text-orange-400", icon: "mic_off" },
  ban: { label: "Бан", color: "text-red-400", icon: "block" },
};

const PLATFORM: Record<string, string> = {
  telegram: "Telegram",
  twitch: "Twitch",
  all: "Все платформы",
};

const APPEAL_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "На рассмотрении", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  approved: { label: "Одобрена", color: "text-green-400", bg: "bg-green-400/10" },
  rejected: { label: "Отклонена", color: "text-red-400", bg: "bg-red-400/10" },
  clarify: { label: "Запрошено уточнение", color: "text-[#9caffc]", bg: "bg-[#9caffc]/10" },
};

export default function AppealPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [punishment, setPunishment] = useState<any>(null);
  const [existingAppeal, setExistingAppeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    client
      .get("/moderation/my/")
      .then((r) => {
        const p = r.data.find((v: any) => v.id === id);
        setPunishment(p || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Проверяем есть ли уже апелляция
    client
      .get(`/moderation/punishments/${id}/appeal/`)
      .then((r) => setExistingAppeal(r.data))
      .catch(() => {});
  }, [id]);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError("Напиши текст апелляции");
      return;
    }
    if (text.trim().length < 20) {
      setError("Апелляция слишком короткая — минимум 20 символов");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await client.post(`/moderation/punishments/${id}/appeal/`, { text });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Ошибка при подаче апелляции");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-[#111] rounded-xl animate-pulse w-48" />
        <div className="h-40 bg-[#111] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!punishment) {
    return (
      <div className="max-w-2xl">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-red-400 text-5xl block mb-4">
            error
          </span>
          <p className="text-red-400 font-black text-xl uppercase">Наказание не найдено</p>
          <button
            onClick={() => navigate("/dashboard/violations")}
            className="mt-6 text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors"
          >
            ← Назад к нарушениям
          </button>
        </div>
      </div>
    );
  }

  const t = TYPE[punishment.punishment_type] || TYPE.warning;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard/violations")}
          className="w-9 h-9 rounded-xl bg-[#111] border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
        </button>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
            Апел<span className="text-[#9caffc]">ляция</span>
          </h1>
          <p className="text-white/40 text-sm mt-0.5">Оспорить наказание</p>
        </div>
      </div>

      {/* Информация о наказании */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">
          Наказание
        </p>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`material-symbols-outlined text-sm ${t.color}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {t.icon}
            </span>
            <span className={`text-sm font-black uppercase ${t.color}`}>{t.label}</span>
          </div>
          <span className="text-white/20">·</span>
          <span className="text-xs text-white/40">
            {PLATFORM[punishment.platform] || punishment.platform}
          </span>
          <span className="text-white/20">·</span>
          <span className="text-xs text-white/30">
            {new Date(punishment.issued_at).toLocaleDateString("ru-RU")}
          </span>
        </div>
        <p className="text-white/70 text-sm">
          {punishment.reason || "Нарушение правил сообщества"}
        </p>
      </div>

      {/* Уже есть апелляция */}
      {existingAppeal && (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">Апелляция подана</p>
            <div className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${APPEAL_STATUS[existingAppeal.status]?.bg} ${APPEAL_STATUS[existingAppeal.status]?.color}`}>
              {APPEAL_STATUS[existingAppeal.status]?.label || existingAppeal.status}
            </div>
          </div>
          <div className="bg-[#1C1B1B] rounded-xl p-4">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Твой текст</p>
            <p className="text-white/70 text-sm">{existingAppeal.text}</p>
          </div>
          {existingAppeal.moderator_response && (
            <div className="bg-[#9caffc]/5 border border-[#9caffc]/20 rounded-xl p-4">
              <p className="text-[10px] text-[#9caffc]/60 uppercase tracking-widest mb-2">
                Ответ модератора
              </p>
              <p className="text-white/70 text-sm">{existingAppeal.moderator_response}</p>
            </div>
          )}
        </div>
      )}

      {/* Форма */}
      {!existingAppeal && !success && (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-4">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
            Твоя апелляция
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Объясни почему считаешь наказание несправедливым. Чем подробнее — тем лучше."
              rows={5}
              className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 resize-none placeholder-white/20"
            />
            <p className="text-[10px] text-white/20 mt-1.5 text-right">
              {text.length} символов (мин. 20)
            </p>
          </div>

          <div className="bg-[#1C1B1B] rounded-xl p-4 text-xs text-white/30 space-y-1">
            <p className="font-bold text-white/40 uppercase tracking-widest text-[10px] mb-2">Правила подачи апелляции</p>
            <p>· Одно наказание — одна апелляция</p>
            <p>· Апелляция рассматривается в течение 48 часов</p>
            <p>· Решение модератора является окончательным</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || text.trim().length < 20}
            className="w-full py-3 bg-[#9caffc] text-[#0a0a0a] font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-[#7b94f8] transition-colors disabled:opacity-40"
          >
            {submitting ? "Отправляем..." : "Подать апелляцию"}
          </button>
        </div>
      )}

      {/* Успех */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
          <span
            className="material-symbols-outlined text-green-400 text-5xl block mb-4"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <p className="text-green-400 font-black text-xl uppercase tracking-tight">
            Апелляция подана
          </p>
          <p className="text-green-400/60 text-sm mt-2">
            Модератор рассмотрит её в течение 48 часов
          </p>
          <button
            onClick={() => navigate("/dashboard/violations")}
            className="mt-6 text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors"
          >
            ← Назад к нарушениям
          </button>
        </div>
      )}
    </div>
  );
}
