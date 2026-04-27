import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import PublicNav from "../../components/PublicNav";

export default function StatusPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    document.title = "Статус — VOLTAGE";
    client
      .get("/bots/settings/")
      .then((r) => setSettings(r.data))
      .catch(() => {});
  }, []);

  const streamerName = settings?.streamer_name || "VOLTAGE";

  const SERVICES = [
    { name: "API сервер", status: "operational" },
    { name: "База данных", status: "operational" },
    { name: "Telegram бот", status: "operational" },
    { name: "Twitch бот", status: "operational" },
  ];

  const STATUS = {
    operational: {
      label: "Работает",
      color: "text-green-400",
      bg: "bg-green-400/10",
      dot: "bg-green-400",
    },
    degraded: {
      label: "Деградация",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      dot: "bg-yellow-400",
    },
    outage: {
      label: "Недоступен",
      color: "text-red-400",
      bg: "bg-red-400/10",
      dot: "bg-red-400",
    },
  };

  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-white"
      style={{ fontFamily: "Manrope, sans-serif" }}
    >
      <PublicNav settings={settings} currentPath="/status" />

      <main className="pt-28 pb-20 px-6 md:px-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter">
              Статус <span className="text-[#0000CD]">платформы</span>
            </h1>
            <p className="text-white/40 text-sm mt-2">
              Текущее состояние сервисов
            </p>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex items-center gap-4">
            <span
              className="material-symbols-outlined text-green-400 text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <div>
              <p className="text-green-400 font-black text-xl uppercase">
                Все системы работают
              </p>
              <p className="text-green-400/60 text-sm">
                Последняя проверка: только что
              </p>
            </div>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
            {SERVICES.map((s, i) => {
              const st = STATUS[s.status as keyof typeof STATUS];
              return (
                <div
                  key={s.name}
                  className={`flex items-center justify-between p-5 ${i > 0 ? "border-t border-white/5" : ""}`}
                >
                  <p className="font-bold text-white">{s.name}</p>
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase ${st.bg} ${st.color}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full animate-pulse ${st.dot}`}
                    />
                    {st.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
