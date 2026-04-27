import { useEffect, useState } from "react";
import client from "../../api/client";

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: {
    label: "Ожидает",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  processing: {
    label: "В обработке",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  sent: { label: "Отправлен", color: "text-blue-400", bg: "bg-blue-400/10" },
  delivered: {
    label: "Получен",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  failed: { label: "Ошибка", color: "text-red-400", bg: "bg-red-400/10" },
  cancelled: { label: "Отменён", color: "text-white/40", bg: "bg-white/5" },
};

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/prizes/my/")
      .then((r) => setPrizes(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tighter">
          Мои <span className="text-[#0000CD]">призы</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">История выигранных призов</p>
      </div>

      {loading ? (
        <p className="text-white/40 text-sm">Загрузка...</p>
      ) : prizes.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-16 text-center">
          <span className="material-symbols-outlined text-white/10 text-7xl block mb-4">
            inventory
          </span>
          <p className="text-white/40 text-lg font-bold uppercase">
            Призов пока нет
          </p>
          <p className="text-white/20 text-sm mt-2">
            Участвуй в розыгрышах и выигрывай!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {prizes.map((p) => {
            const s = STATUS[p.status] || STATUS.pending;
            return (
              <div
                key={p.id}
                className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-5"
              >
                <div className="w-14 h-14 rounded-xl bg-[#1C1B1B] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white/20 text-2xl">
                    redeem
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{p.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {p.delivery_method} · {p.created_at?.slice(0, 10)}
                  </p>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase ${s.bg} ${s.color}`}
                >
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
