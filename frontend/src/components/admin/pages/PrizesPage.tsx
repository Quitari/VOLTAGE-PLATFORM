import { useEffect, useState } from "react";
import client from "../../../api/client";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Ожидает", color: "bg-yellow-500/15 text-yellow-400" },
  processing: { label: "В обработке", color: "bg-blue-500/15 text-blue-400" },
  sent: { label: "Отправлен", color: "bg-blue-500/15 text-blue-400" },
  delivered: { label: "Получен", color: "bg-green-500/15 text-green-400" },
  failed: { label: "Ошибка", color: "bg-red-500/15 text-red-400" },
  cancelled: { label: "Отменён", color: "bg-white/10 text-white/40" },
};

const DELIVERY_LABELS: Record<string, string> = {
  lisskins: "LisSkins",
  inventory: "Инвентарь",
  manual: "Вручную",
};

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/prizes/list/")
      .then((res) => setPrizes(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
          ПРИЗЫ И ДОСТАВКА
        </h1>
        <p className="text-white/40 text-sm mt-1">Всего: {prizes.length}</p>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#1C1B1B]">
              {[
                "Приз",
                "Розыгрыш",
                "Победитель",
                "Статус",
                "Доставка",
                "Создан",
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
                  colSpan={6}
                  className="px-6 py-8 text-center text-white/40 text-sm"
                >
                  Загрузка...
                </td>
              </tr>
            ) : prizes.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-white/40 text-sm"
                >
                  Нет призов
                </td>
              </tr>
            ) : (
              prizes.map((prize) => {
                const st = STATUS_LABELS[prize.status];
                return (
                  <tr
                    key={prize.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">
                        {prize.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white/60">
                        {prize.giveaway_title || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white/60">
                        {prize.recipient?.username || "—"}
                      </p>
                      {prize.steam_trade_url && (
                        <p className="text-xs text-white/30">Steam привязан</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${st?.color}`}
                      >
                        {st?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/60">
                      {DELIVERY_LABELS[prize.delivery_method] ||
                        prize.delivery_method}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40">
                      {prize.created_at?.slice(0, 10)}
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
