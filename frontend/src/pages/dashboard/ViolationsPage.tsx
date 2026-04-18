import { useEffect, useState } from "react";
import client from "../../api/client";

const TYPE: Record<string, { label: string; color: string; bg: string }> = {
  warning: {
    label: "Предупреждение",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/20",
  },
  mute: {
    label: "Мут",
    color: "text-orange-400",
    bg: "bg-orange-400/10 border-orange-400/20",
  },
  ban: {
    label: "Бан",
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/20",
  },
};

const PLATFORM: Record<string, string> = {
  telegram: "Telegram",
  twitch: "Twitch",
  all: "Все платформы",
};

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
      <div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
          Нару<span className="text-[#FFE100]">шения</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">
          История наказаний на аккаунте
        </p>
      </div>

      {loading ? (
        <p className="text-white/40 text-sm">Загрузка...</p>
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
        <div className="space-y-8">
          {/* Активные */}
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Активные наказания — {active.length}
              </h2>
              {active.map((v) => {
                const t = TYPE[v.punishment_type] || TYPE.warning;
                return (
                  <div key={v.id} className={`border rounded-2xl p-5 ${t.bg}`}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black px-3 py-1 rounded-lg uppercase border ${t.bg} ${t.color}`}
                        >
                          {t.label}
                        </span>
                        <span className="text-xs font-bold text-white/40 bg-white/5 px-2 py-1 rounded-lg">
                          {PLATFORM[v.platform] ||
                            v.platform ||
                            "Все платформы"}
                        </span>
                      </div>
                      <span className="text-xs text-white/30">
                        {v.created_at?.slice(0, 10)}
                      </span>
                    </div>
                    <p className="text-white font-bold mb-1">
                      {v.reason || "Нарушение правил сообщества"}
                    </p>
                    {v.expires_at && (
                      <p className="text-xs text-white/40">
                        Истекает: {v.expires_at?.slice(0, 10)}
                      </p>
                    )}
                    {v.moderator && (
                      <p className="text-xs text-white/30 mt-1">
                        Модератор: {v.moderator}
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <button
                        onClick={() =>
                          (window.location.href = `/dashboard/violations/${v.id}/appeal`)
                        }
                        className="text-xs font-bold text-[#FFE100] hover:underline uppercase tracking-widest flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          balance
                        </span>
                        Подать апелляцию
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Истёкшие */}
          {expired.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                История — {expired.length}
              </h2>
              {expired.map((v) => {
                const t = TYPE[v.punishment_type] || TYPE.warning;
                return (
                  <div
                    key={v.id}
                    className="bg-[#111] border border-white/5 rounded-2xl p-5 opacity-60"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black px-3 py-1 rounded-lg uppercase ${t.color} bg-white/5`}
                        >
                          {t.label}
                        </span>
                        <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded-lg">
                          {PLATFORM[v.platform] || "Все платформы"}
                        </span>
                      </div>
                      <span className="text-xs text-white/30">
                        {v.created_at?.slice(0, 10)}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm">
                      {v.reason || "Нарушение правил"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
