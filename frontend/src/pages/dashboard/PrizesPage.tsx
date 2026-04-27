import { useEffect, useState } from "react";
import client from "../../api/client";

const STATUS_STEPS = ["pending", "processing", "sent", "delivered"];

const STATUS: Record<
  string,
  { label: string; color: string; bg: string; border: string; step: number }
> = {
  pending: {
    label: "Ожидает",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
    step: 0,
  },
  processing: {
    label: "В обработке",
    color: "text-[#0000CD]",
    bg: "bg-[#0000CD]/10",
    border: "border-[#0000CD]/20",
    step: 1,
  },
  sent: {
    label: "Отправлен",
    color: "text-[#0000CD]",
    bg: "bg-[#0000CD]/10",
    border: "border-[#0000CD]/20",
    step: 2,
  },
  delivered: {
    label: "Получен",
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/20",
    step: 3,
  },
  failed: {
    label: "Ошибка",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
    step: -1,
  },
  cancelled: {
    label: "Отменён",
    color: "text-white/40",
    bg: "bg-white/5",
    border: "border-white/10",
    step: -1,
  },
};

const DELIVERY: Record<string, string> = {
  lisskins: "LisSkins",
  inventory: "Инвентарь бота",
  manual: "Вручную",
};

const STEP_LABELS = ["Оформлено", "В обработке", "Отправлено", "Получено"];

function ProgressBar({ status }: { status: string }) {
  const s = STATUS[status];
  if (!s || s.step < 0) return null;
  const step = s.step;
  const progress = (step / (STATUS_STEPS.length - 1)) * 100;
  const isDelivered = status === "delivered";

  return (
    <div className="mt-5 pt-5 border-t border-white/5">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">
        {STEP_LABELS.map((label, i) => (
          <span
            key={label}
            className={
              i <= step
                ? isDelivered
                  ? "text-green-400"
                  : "text-[#0000CD]"
                : "text-white/20"
            }
          >
            {label}
          </span>
        ))}
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full relative">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isDelivered ? "bg-green-400" : "bg-[#0000CD]"}`}
          style={{ width: `${progress}%` }}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all duration-500 ${isDelivered ? "bg-green-400 border-[#111]" : "bg-[#0000CD] border-[#111]"}`}
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>
      {isDelivered && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mt-3 flex items-center gap-1.5">
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          Доставлено и подтверждено
        </p>
      )}
    </div>
  );
}

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "history">("all");

  useEffect(() => {
    client
      .get("/prizes/my/")
      .then((r) => setPrizes(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = prizes.filter((p) =>
    ["pending", "processing", "sent"].includes(p.status),
  );
  const history = prizes.filter((p) =>
    ["delivered", "failed", "cancelled"].includes(p.status),
  );

  const filtered =
    filter === "active" ? active : filter === "history" ? history : prizes;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tighter">
          Мои <span className="text-[#0000CD]">призы</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">История выигранных призов</p>
      </div>

      {/* Фильтры */}
      {!loading && prizes.length > 0 && (
        <div className="flex items-center gap-1 bg-[#111] border border-white/5 rounded-xl p-1 w-fit">
          {[
            { key: "all", label: "Все", count: prizes.length },
            { key: "active", label: "Активные", count: active.length },
            { key: "history", label: "История", count: history.length },
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
                      ? "bg-white/20 text-white"
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

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#111] border border-white/5 rounded-2xl h-36 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-16 text-center">
          <span className="material-symbols-outlined text-white/10 text-7xl block mb-4">
            inventory
          </span>
          <p className="text-white/40 text-lg font-bold uppercase">
            {filter === "active"
              ? "Нет активных призов"
              : filter === "history"
                ? "История пуста"
                : "Призов пока нет"}
          </p>
          <p className="text-white/20 text-sm mt-2">
            Участвуй в розыгрышах и выигрывай!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const s = STATUS[p.status] || STATUS.pending;
            const isCancelled =
              p.status === "cancelled" || p.status === "failed";

            return (
              <div
                key={p.id}
                className={`bg-[#111] border rounded-2xl overflow-hidden transition-colors hover:bg-[#141414] ${s.border} ${isCancelled ? "opacity-60" : ""}`}
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Фото приза */}
                  <div className="lg:w-52 h-36 lg:h-auto bg-[#0E0E0E] flex items-center justify-center p-4 flex-shrink-0 relative overflow-hidden">
                    {p.skin_image_url ? (
                      <img
                        src={p.skin_image_url}
                        alt={p.name}
                        className={`max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105 ${isCancelled ? "grayscale" : ""}`}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-white/10 text-5xl">
                        redeem
                      </span>
                    )}
                    {/* Статус оверлей */}
                    <div
                      className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-black uppercase ${s.bg} ${s.color}`}
                    >
                      {s.label}
                    </div>
                  </div>

                  {/* Контент */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-xl uppercase tracking-tight truncate">
                          {p.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs text-white/40 font-bold uppercase tracking-widest">
                            {DELIVERY[p.delivery_method] || p.delivery_method}
                          </span>
                          {p.giveaway_ends_at && (
                            <>
                              <span className="text-white/20">·</span>
                              <span className="text-xs text-white/30">
                                {new Date(
                                  p.giveaway_ends_at,
                                ).toLocaleDateString("ru-RU", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Прогресс-бар */}
                    {!isCancelled && <ProgressBar status={p.status} />}

                    {/* Ошибка */}
                    {p.status === "failed" && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-bold uppercase tracking-widest">
                        Ошибка доставки — обратитесь в поддержку
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
