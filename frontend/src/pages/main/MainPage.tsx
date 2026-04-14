import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import type { Giveaway } from "../../types";

export default function MainPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>(null);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get("/bots/settings/"),
      client.get("/giveaways/?status=active"),
      client.get("/giveaways/?status=finished"),
    ])
      .then(([s, g, w]) => {
        setSettings(s.data);
        setGiveaways(g.data);
        setWinners(w.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#FFE100] text-xl font-black tracking-tighter animate-pulse">
          VOLTAGE...
        </div>
      </div>
    );

  const name = settings?.streamer_name || "VOLTAGE";
  const description =
    settings?.streamer_description ||
    "Профессиональный стример. Розыгрыши каждый стрим.";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-body">
      {/* Nav */}
      <nav className="bg-[#0E0E0E]/70 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center w-full px-8 py-4 border-b border-white/5">
        <div className="text-2xl font-black tracking-tighter text-[#FFE100] uppercase">
          {name}
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <a
            href="/"
            className="text-[#FFE100] border-b-2 border-[#FFE100] pb-1 font-bold uppercase text-sm"
          >
            Главная
          </a>
          {settings?.show_schedule && (
            <a
              href="#schedule"
              className="text-white/70 hover:text-white transition-colors font-bold uppercase text-sm"
            >
              Расписание
            </a>
          )}
          {settings?.show_rules && (
            <a
              href="/rules"
              className="text-white/70 hover:text-white transition-colors font-bold uppercase text-sm"
            >
              Правила
            </a>
          )}
        </div>
        <button
          onClick={() => navigate("/login")}
          className="bg-[#FFE100] text-[#211C00] px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#FFE330] transition-colors active:scale-95"
        >
          ВОЙТИ
        </button>
      </nav>

      {/* Hero */}
      <header className="relative w-full min-h-[600px] flex items-end pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {settings?.streamer_avatar_url ? (
            <img
              src={settings.streamer_avatar_url}
              alt={name}
              className="w-full h-full object-cover grayscale opacity-40"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1C1B1B] to-[#0A0A0A]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
        </div>

        <div className="container mx-auto px-8 relative z-10 flex flex-col items-start gap-6">
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase text-white leading-none">
            {name.split(" ").map((word: string, i: number) => (
              <span key={i}>
                {i === 0 ? (
                  word
                ) : (
                  <span className="text-[#FFE100]">{" " + word}</span>
                )}
              </span>
            ))}
          </h1>
          <p className="max-w-2xl text-lg text-white/70 font-medium leading-relaxed">
            {description}
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <button
              onClick={() => navigate("/register")}
              className="bg-[#FFE100] text-[#211C00] px-8 py-4 rounded-lg font-bold uppercase flex items-center gap-2 hover:bg-[#FFE330] transition-colors"
            >
              Зарегистрироваться
            </button>
            {settings?.twitch_url && (
              <a
                href={settings.twitch_url}
                target="_blank"
                rel="noreferrer"
                className="bg-[#9146FF]/20 backdrop-blur-md text-[#9146FF] px-8 py-4 rounded-lg font-bold uppercase border border-[#9146FF]/30 hover:bg-[#9146FF]/30 transition-colors"
              >
                Twitch
              </a>
            )}
            {settings?.telegram_url && (
              <a
                href={settings.telegram_url}
                target="_blank"
                rel="noreferrer"
                className="bg-white/5 backdrop-blur-md text-white px-8 py-4 rounded-lg font-bold uppercase border border-white/10 hover:bg-white/10 transition-colors"
              >
                Telegram
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-8 py-24 space-y-32">
        {/* Активные розыгрыши */}
        {settings?.show_giveaways !== false && (
          <section>
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-4xl font-black uppercase tracking-tight">
                Активные <span className="text-[#FFE100]">розыгрыши</span>
              </h2>
              <div className="h-1 w-24 bg-[#FFE100]" />
            </div>

            {giveaways.length === 0 ? (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-12 text-center">
                <p className="text-white/40">Сейчас нет активных розыгрышей</p>
                <p className="text-white/20 text-sm mt-1">
                  Следи за анонсами в Telegram
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {giveaways.map((g) => (
                  <div
                    key={g.id}
                    className="bg-[#1C1B1B] hover:bg-[#2A2A2A] transition-all hover:scale-[1.02] p-6 rounded-xl flex flex-col gap-4"
                  >
                    <div className="relative rounded-lg overflow-hidden h-48 bg-[#0E0E0E] flex items-center justify-center">
                      <span
                        className="material-symbols-outlined text-white/10"
                        style={{ fontSize: "80px" }}
                      >
                        redeem
                      </span>
                      <div className="absolute top-3 left-3 bg-[#FFE100] text-[#211C00] px-2 py-0.5 rounded font-bold text-[10px] uppercase">
                        АКТИВНЫЙ
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-xl font-bold uppercase tracking-tight">
                        {g.title}
                      </h3>
                      {g.skin_name && (
                        <p className="text-sm text-white/50">{g.skin_name}</p>
                      )}
                      <div className="flex justify-between text-sm text-white/50 mt-2">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            group
                          </span>
                          {g.participants_count} участников
                        </span>
                        <span className="text-[#FFE100] text-xs font-bold uppercase">
                          {g.platform === "telegram"
                            ? "Telegram"
                            : g.platform === "twitch"
                              ? "Twitch"
                              : "Все"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate("/login")}
                      className="w-full py-3 bg-[#FFE100]/10 text-[#FFE100] font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-[#FFE100]/20 transition-colors mt-auto"
                    >
                      Участвовать
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Победители и расписание */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Победители */}
          {settings?.show_winners !== false && (
            <section className="lg:col-span-1">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-8">
                Последние <span className="text-[#FFE100]">победители</span>
              </h2>
              {winners.length === 0 ? (
                <p className="text-white/30 text-sm">Пока нет победителей</p>
              ) : (
                <div className="space-y-4">
                  {winners.slice(0, 5).map((g) =>
                    g.winners?.slice(0, 1).map((w: any) => (
                      <div
                        key={w.id}
                        className="flex items-center gap-4 bg-[#1C1B1B] p-4 rounded-xl"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#FFE100]/10 flex items-center justify-center text-[#FFE100] font-black text-sm flex-shrink-0">
                          {w.user?.username?.slice(0, 2).toUpperCase() || "??"}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-bold text-white uppercase text-sm truncate">
                            {w.user?.username || "—"}
                          </span>
                          <span className="text-xs text-white/50 truncate">
                            {g.title}
                          </span>
                        </div>
                      </div>
                    )),
                  )}
                </div>
              )}
            </section>
          )}

          {/* Расписание */}
          {settings?.show_schedule !== false &&
            settings?.schedule?.length > 0 && (
              <section id="schedule" className="lg:col-span-2">
                <h2 className="text-2xl font-black uppercase tracking-tight mb-8">
                  Расписание <span className="text-[#FFE100]">стримов</span>
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {settings.schedule.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="bg-[#1C1B1B] hover:bg-[#2A2A2A] transition-colors p-6 rounded-xl"
                    >
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                        {item.day}
                      </p>
                      <p className="text-3xl font-black text-[#FFE100]">
                        {item.time}
                      </p>
                      {item.note && (
                        <p className="text-xs text-white/40 mt-2">
                          {item.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0A0A0A] py-12 border-t border-white/5 mt-32">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="text-xl font-black text-[#FFE100] uppercase">
              {name}
            </div>
            <p className="text-white/30 text-xs max-w-xs text-center md:text-left">
              © 2026 {name}. Все права защищены.
            </p>
          </div>

          <div className="flex gap-12">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">
                Инфо
              </span>
              {settings?.show_rules && (
                <a
                  href="/rules"
                  className="text-white/50 hover:text-[#FFE100] transition-colors text-sm"
                >
                  Правила
                </a>
              )}
              <a
                href="/login"
                className="text-white/50 hover:text-[#FFE100] transition-colors text-sm"
              >
                Войти
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">
                Соцсети
              </span>
              {settings?.twitch_url && (
                <a
                  href={settings.twitch_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/50 hover:text-[#FFE100] transition-colors text-sm"
                >
                  Twitch
                </a>
              )}
              {settings?.telegram_url && (
                <a
                  href={settings.telegram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/50 hover:text-[#FFE100] transition-colors text-sm"
                >
                  Telegram
                </a>
              )}
              {settings?.vk_url && (
                <a
                  href={settings.vk_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/50 hover:text-[#FFE100] transition-colors text-sm"
                >
                  VK
                </a>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
