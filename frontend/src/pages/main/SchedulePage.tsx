import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import client from "../../api/client";
import PublicNav from "../../components/PublicNav";

const DAYS_ORDER = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function SchedulePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifySuccess, setNotifySuccess] = useState(false);

  useEffect(() => {
    document.title = "Расписание — VOLTAGE";
    client
      .get("/bots/settings/")
      .then((r) => setSettings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const streamerName = settings?.streamer_name || "VOLTAGE";

  const navItems = [
    { label: "Главная", href: "/", show: true },
    { label: "Расписание", href: "/schedule", show: !!settings?.show_schedule },
    { label: "Моменты", href: "/moments", show: !!settings?.show_moments },
    { label: "Правила", href: "/rules", show: !!settings?.show_rules },
  ].filter((i) => i.show);

  const schedule = settings?.schedule || [];

  // Сортируем по дням недели]
  const sorted = [...schedule].sort((a, b) => {
    const ai = DAYS_ORDER.findIndex((d) => a.day?.startsWith(d));
    const bi = DAYS_ORDER.findIndex((d) => b.day?.startsWith(d));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Все 7 дней — заполняем пустые
  const grid = DAYS_ORDER.map((day) => {
    const found = sorted.find((s) => s.day?.startsWith(day));
    return { day, item: found || null };
  });

  const handleNotify = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!user?.has_telegram) {
      navigate("/dashboard/connections");
      return;
    }
    setNotifySuccess(true);
    setTimeout(() => setNotifySuccess(false), 3000);
  };

  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-white"
      style={{ fontFamily: "Manrope, sans-serif" }}
    >
      {/* Nav */}
      <PublicNav settings={settings} currentPath="/schedule" />

      <main className="pt-28 pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Hero */}
          <section className="relative bg-[#111] border border-white/5 rounded-2xl overflow-hidden p-8 md:p-16 min-h-[300px] flex items-center">
            <div className="absolute inset-0 z-0">
              {settings?.streamer_avatar_file ||
              settings?.streamer_avatar_url ? (
                <img
                  src={
                    settings.streamer_avatar_file ||
                    settings.streamer_avatar_url
                  }
                  alt=""
                  className="w-full h-full object-cover opacity-10 blur-sm"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-[#FFE100]/20 text-[#FFE100] text-xs font-black px-3 py-1 rounded-lg uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#FFE100] rounded-full animate-pulse" />
                  Расписание стримов
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-8">
                ГРАФИК <span className="text-[#FFE100]">ТРАНСЛЯЦИЙ</span>
              </h1>
              <button
                onClick={handleNotify}
                className="bg-[#FFE100] text-[#211C00] px-8 py-4 rounded-xl font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-[#FFE330] transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">
                  notifications_active
                </span>
                {notifySuccess ? "✅ Уведомление настроено!" : "Уведомить меня"}
              </button>
              {!isAuthenticated && (
                <p className="text-white/30 text-xs mt-3">
                  Требуется привязка Telegram
                </p>
              )}
              {isAuthenticated && !user?.has_telegram && (
                <p className="text-white/30 text-xs mt-3">
                  Нужно{" "}
                  <button
                    onClick={() => navigate("/dashboard/connections")}
                    className="text-[#FFE100] hover:underline"
                  >
                    привязать Telegram
                  </button>
                </p>
              )}
            </div>
          </section>

          {/* Сетка по дням */}
          <section className="space-y-6">
            <div className="flex justify-between items-end">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
                РАСПИСАНИЕ <span className="text-[#FFE100]">НЕДЕЛИ</span>
              </h2>
            </div>

            {loading ? (
              <p className="text-white/40 text-sm">Загрузка...</p>
            ) : schedule.length === 0 ? (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-12 text-center">
                <span className="material-symbols-outlined text-white/10 text-7xl block mb-4">
                  calendar_month
                </span>
                <p className="text-white/40 text-lg font-bold uppercase">
                  Расписание не задано
                </p>
                <p className="text-white/20 text-sm mt-2">
                  Следи за анонсами в Telegram
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {grid.map(({ day, item }) => (
                  <div
                    key={day}
                    className={`rounded-2xl p-5 min-h-[200px] flex flex-col relative overflow-hidden transition-colors ${
                      item
                        ? "bg-[#111] border border-white/5 hover:bg-[#1C1B1B]"
                        : "bg-[#0E0E0E]/50 border border-white/5 opacity-40"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-8">
                      <span
                        className={`text-4xl font-black ${item ? "text-white/10" : "text-white/5"}`}
                      >
                        {day}
                      </span>
                      {item && (
                        <span className="text-xs font-bold text-[#FFE100] bg-[#FFE100]/10 px-2 py-1 rounded-lg">
                          {item.time}
                        </span>
                      )}
                    </div>
                    {item ? (
                      <div className="mt-auto">
                        {item.note && (
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                            {item.note}
                          </p>
                        )}
                        <h3 className="text-sm font-black uppercase leading-tight text-white">
                          Стрим
                        </h3>
                      </div>
                    ) : (
                      <div className="mt-auto">
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest">
                          Выходной
                        </p>
                      </div>
                    )}
                    {item && (
                      <span className="material-symbols-outlined absolute -bottom-3 -right-3 text-7xl text-white/3">
                        live_tv
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Прошедшие стримы — заглушка */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <span className="material-symbols-outlined text-[#FFE100]">
                history
              </span>
              Прошедшие стримы
            </h2>
            <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center opacity-60">
              <span className="material-symbols-outlined text-white/10 text-5xl block mb-3">
                live_tv
              </span>
              <p className="text-white/40 text-sm font-bold uppercase">
                История стримов
              </p>
              <p className="text-white/20 text-xs mt-1">
                Будет доступна после интеграции с Twitch API
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0E0E0E] py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-lg font-black text-[#FFE100] uppercase tracking-tighter">
            {streamerName}
          </div>
          <div className="flex items-center gap-8 text-xs uppercase tracking-widest font-medium">
            {settings?.show_rules && (
              <a
                href="/rules"
                className="text-white/40 hover:text-[#FFE100] transition-colors"
              >
                Правила
              </a>
            )}
            {settings?.telegram_url && (
              <a
                href={settings.telegram_url}
                target="_blank"
                rel="noreferrer"
                className="text-white/40 hover:text-[#FFE100] transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">send</span>{" "}
                Telegram
              </a>
            )}
            {settings?.twitch_url && (
              <a
                href={settings.twitch_url}
                target="_blank"
                rel="noreferrer"
                className="text-white/40 hover:text-[#FFE100] transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">
                  live_tv
                </span>{" "}
                Twitch
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
