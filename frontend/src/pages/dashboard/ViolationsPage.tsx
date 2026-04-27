import { useEffect, useState } from "react";
import client from "../../api/client";

const TYPE: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  warning: {
    label: "Предупреждение",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
    icon: "warning",
  },
  mute: {
    label: "Мут",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
    icon: "mic_off",
  },
  ban: {
    label: "Бан",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
    icon: "block",
  },
};

const PLATFORM: Record<string, { label: string; icon: string }> = {
  telegram: { label: "Telegram", icon: "send" },
  twitch: { label: "Twitch", icon: "live_tv" },
  all: { label: "Все платформы", icon: "public" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ViolationsPage() {
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/moderation/my/")
      .then((r) => setViolations(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = violations.filter((v) => v.is_active);
  const expired = violations.filter((v) => !v.is_active);

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Заголовок */}
      <div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
          НАРУ<span className="text-[#9caffc]">ШЕНИЯ</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">
          История наказаний на аккаунте
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#111] border border-white/5 rounded-2xl h-24 animate-pulse"
            />
          ))}
        </div>
      ) : violations.length === 0 ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-12 text-center">
          <span
            className="material-symbols-outlined text-green-400 text-7xl block mb-4"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified_user
          </span>
          <p className="text-green-400 font-black text-2xl uppercase tracking-tight">
            Нарушений нет
          </p>
          <p className="text-green-400/60 text-sm mt-2">
            Твой аккаунт в полной безопасности. Мы ценим честную игру.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Активные наказания */}
          {active.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">
                Активные наказания — {active.length}
              </p>
              <div className="space-y-3">
                {active.map((v) => {
                  const t = TYPE[v.punishment_type] || TYPE.warning;
                  const platform = PLATFORM[v.platform] || {
                    label: v.platform || "Все платформы",
                    icon: "public",
                  };
                  return (
                    <div
                      key={v.id}
                      className={`border rounded-2xl overflow-hidden ${t.border} ${t.bg}`}
                    >
                      <div className="p-5">
                        {/* Шапка */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Иконка + тип */}
                            <div
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${t.bg} ${t.border}`}
                            >
                              <span
                                className={`material-symbols-outlined text-sm ${t.color}`}
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                {t.icon}
                              </span>
                              <span
                                className={`text-xs font-black uppercase tracking-widest ${t.color}`}
                              >
                                {t.label}
                              </span>
                            </div>
                            {/* Платформа */}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                              <span className="material-symbols-outlined text-sm text-white/40">
                                {platform.icon}
                              </span>
                              <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                                {platform.label}
                              </span>
                            </div>
                          </div>
                          {/* Дата */}
                          <span className="text-xs text-white/30 font-bold whitespace-nowrap flex-shrink-0">
                            {formatDate(v.issued_at)}
                          </span>
                        </div>

                        {/* Причина */}
                        <p className="text-white font-bold text-sm mb-2">
                          {v.reason || "Нарушение правил сообщества"}
                        </p>

                        {/* Мета */}
                        <div className="flex items-center gap-4 flex-wrap">
                          {v.expires_at && (
                            <span className="text-xs text-white/40 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">
                                schedule
                              </span>
                              Истекает: {formatDateTime(v.expires_at)}
                            </span>
                          )}
                          {v.moderator && (
                            <span className="text-xs text-white/30 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">
                                shield_person
                              </span>
                              {v.moderator}
                            </span>
                          )}
                        </div>

                        {/* Апелляция */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <button
                            onClick={() =>
                              (window.location.href = `/dashboard/violations/${v.id}/appeal`)
                            }
                            className="text-xs font-bold text-[#9caffc] hover:underline uppercase tracking-widest flex items-center gap-1.5 transition-opacity hover:opacity-80"
                          >
                            <span className="material-symbols-outlined text-sm">
                              balance
                            </span>
                            Подать апелляцию
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* История */}
          {expired.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-4">
                История — {expired.length}
              </p>

              {/* Таймлайн */}
              <div className="relative">
                {/* Вертикальная линия */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-white/5" />

                <div className="space-y-3">
                  {expired.map((v) => {
                    const t = TYPE[v.punishment_type] || TYPE.warning;
                    const platform = PLATFORM[v.platform] || {
                      label: v.platform || "Все платформы",
                      icon: "public",
                    };
                    return (
                      <div
                        key={v.id}
                        className="flex gap-4 opacity-50 hover:opacity-70 transition-opacity"
                      >
                        {/* Иконка таймлайна */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#1C1B1B] border border-white/5 z-10`}
                        >
                          <span
                            className={`material-symbols-outlined text-base ${t.color}`}
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {t.icon}
                          </span>
                        </div>

                        {/* Карточка */}
                        <div className="flex-1 bg-[#111] border border-white/5 rounded-2xl p-4 mb-1">
                          <div className="flex items-start justify-between gap-4 mb-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs font-black uppercase ${t.color}`}
                              >
                                {t.label}
                              </span>
                              <span className="text-xs text-white/20 bg-white/5 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                                {platform.label}
                              </span>
                            </div>
                            <span className="text-xs text-white/20 whitespace-nowrap flex-shrink-0">
                              {formatDate(v.issued_at)}
                            </span>
                          </div>
                          <p className="text-white/50 text-sm">
                            {v.reason || "Нарушение правил"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
