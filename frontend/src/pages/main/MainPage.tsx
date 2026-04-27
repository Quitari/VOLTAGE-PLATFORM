import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import type { Giveaway } from "../../types";

function MomentsBlock() {
  const navigate = useNavigate();
  const [clips, setClips] = useState<any[]>([]);

  useEffect(() => {
    client
      .get("/clips/?status=approved&limit=4")
      .then((r) => setClips(r.data.slice(0, 4)))
      .catch(() => {});
  }, []);

  return (
    <section id="moments" className="lg:col-span-2">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tight">
          Лучшие <span className="text-[#0000CD]">моменты</span>
        </h2>
        <button
          onClick={() => navigate("/moments")}
          className="text-xs font-bold text-[#0000CD] uppercase hover:underline"
        >
          Все моменты
        </button>
      </div>

      {clips.length === 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="group relative rounded-xl overflow-hidden aspect-video bg-[#1C1B1B]"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-white/10"
                  style={{ fontSize: "48px" }}
                >
                  play_circle
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-sm font-bold uppercase text-white/30">
                  Клипов пока нет
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {clips.map((clip) => (
            <a
              key={clip.id}
              href={clip.url}
              target="_blank"
              rel="noreferrer"
              className="group relative rounded-xl overflow-hidden aspect-video bg-[#1C1B1B] block"
            >
              {clip.preview_url ? (
                <img
                  src={clip.preview_url}
                  alt={clip.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-white/10"
                    style={{ fontSize: "48px" }}
                  >
                    play_circle
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ fontSize: "48px" }}
                >
                  play_circle
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-sm font-bold uppercase truncate">
                  {clip.title}
                </p>
                {clip.game && (
                  <p className="text-xs text-white/50 mt-0.5">{clip.game}</p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

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
        <div className="text-[#0000CD] text-2xl font-black tracking-tighter animate-pulse">
          VOLTAGE...
        </div>
      </div>
    );

  const name = settings?.streamer_name || "VOLTAGE";
  const avatarUrl =
    settings?.streamer_avatar_file || settings?.streamer_avatar_url || "";
  const description =
    settings?.streamer_description ||
    "Профессиональный стример. Розыгрыши каждый стрим.";

  const navItems = [
    { label: "Главная", href: "/", show: true },
    {
      label: "Расписание",
      href: "/schedule",
      show: !!settings?.show_schedule_page,
    },
    { label: "Моменты", href: "/moments", show: !!settings?.show_moments },
    { label: "Правила", href: "/rules", show: !!settings?.show_rules },
    { label: "Статус", href: "/status", show: !!settings?.show_status_page },
  ].filter((item) => item.show);

  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-white"
      style={{ fontFamily: "Manrope, sans-serif" }}
    >
      {/* Nav */}
      <nav className="bg-[#0E0E0E]/70 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center w-full px-8 py-4 border-b border-white/5">
        <div className="text-2xl font-black tracking-tighter text-[#0000CD] uppercase">
          {name}
        </div>
        <div className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? window.location.pathname === "/" && !window.location.hash
                : window.location.pathname === item.href;
            return (
              <a
                key={item.label}
                href={item.href}
                className={`font-bold uppercase text-sm transition-colors ${
                  isActive
                    ? "text-[#0000CD] border-b-2 border-[#0000CD] pb-1"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>
        <button
          onClick={() => navigate("/login")}
          className="bg-[#0000CD] text-[#FFFFFF] px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#1A1AE8] transition-colors active:scale-95"
        >
          ВОЙТИ
        </button>
      </nav>

      {/* Hero */}
      <header className="relative w-full min-h-[600px] lg:min-h-[860px] overflow-hidden">
        {/* Размытый фон для атмосферы */}
        <div className="absolute inset-0 z-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover opacity-20 blur-2xl scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1C1B1B] via-[#111] to-[#0A0A0A]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
        </div>

        {/* Фото стримера — справа, полный цвет */}
        {avatarUrl && (
          <div className="absolute right-0 top-0 h-full w-full z-10 pointer-events-none">
            <img
              src={avatarUrl}
              alt={name}
              className="h-full w-full object-cover"
              style={{
                objectPosition:
                  settings?.streamer_avatar_position || "center center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/70 to-[#0A0A0A]/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/40" />
          </div>
        )}
        {/* Текст — слева */}
        <div className="container mx-auto px-8 relative z-20 flex flex-col items-start gap-6 justify-center min-h-[600px] lg:min-h-[860px] pb-24 max-w-[55%] lg:max-w-[50%]">
          <div className="flex items-center gap-3 bg-green-500/20 text-green-400 px-3 py-1 rounded font-bold text-xs uppercase">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Следи за розыгрышами
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase text-white leading-none">
            {name.split(" ").map((word: string, i: number) =>
              i === 0 ? (
                <span key={i} className="block">
                  {word}
                </span>
              ) : (
                <span key={i} className="block text-[#0000CD]">
                  {word}
                </span>
              ),
            )}
          </h1>

          <p className="max-w-lg text-lg text-white/70 font-medium leading-relaxed">
            {description}
          </p>

          <div className="flex flex-wrap gap-4 mt-4">
            <button
              onClick={() => navigate("/register")}
              className="bg-[#0000CD] text-[#FFFFFF] px-8 py-4 rounded-lg font-bold uppercase flex items-center gap-2 hover:bg-[#1A1AE8] transition-colors"
            >
              Зарегистрироваться
            </button>
            {settings?.twitch_url && (
              <a
                href={settings.twitch_url}
                target="_blank"
                rel="noreferrer"
                className="bg-[#2A2A2A]/60 backdrop-blur-md text-white px-8 py-4 rounded-lg font-bold uppercase border border-white/20 hover:bg-[#3A3939] transition-colors"
              >
                Twitch
              </a>
            )}
            {settings?.telegram_url && (
              <a
                href={settings.telegram_url}
                target="_blank"
                rel="noreferrer"
                className="bg-[#2A2A2A]/60 backdrop-blur-md text-white px-8 py-4 rounded-lg font-bold uppercase border border-white/20 hover:bg-[#3A3939] transition-colors"
              >
                Telegram
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-8 py-24 space-y-32">
        {/* Активные розыгрыши */}
        {settings?.show_giveaways !== false && (
          <section>
            <div className="flex justify-between items-end mb-12">
              <h2 className="text-4xl font-black uppercase tracking-tight">
                Активные <span className="text-[#0000CD]">розыгрыши</span>
              </h2>
              <div className="h-1 w-24 bg-[#0000CD]" />
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
                    className="bg-[#1C1B1B] hover:bg-[#2A2A2A] hover:scale-[1.02] transition-all duration-200 p-6 rounded-xl flex flex-col gap-4 cursor-pointer"
                    onClick={() => navigate("/register")}
                  >
                    <div className="relative rounded-lg overflow-hidden h-48 bg-[#0E0E0E] flex items-center justify-center">
                      <span
                        className="material-symbols-outlined text-white/10"
                        style={{ fontSize: "80px" }}
                      >
                        redeem
                      </span>
                      <div className="absolute top-3 left-3 bg-[#0000CD] text-[#FFFFFF] px-2 py-0.5 rounded font-bold text-[10px] uppercase">
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
                        <span className="text-[#0000CD] text-xs font-bold uppercase">
                          {g.platform === "telegram"
                            ? "TG"
                            : g.platform === "twitch"
                              ? "TW"
                              : "ALL"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Победители и моменты */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Победители */}
          {settings?.show_winners !== false && (
            <section className="lg:col-span-1">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-8">
                Последние <span className="text-[#0000CD]">победители</span>
              </h2>
              {winners.length === 0 ? (
                <div className="bg-[#1C1B1B] rounded-xl p-6 text-center">
                  <p className="text-white/30 text-sm">Пока нет победителей</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {winners.slice(0, 5).map((g) =>
                    g.winners?.slice(0, 1).map((w: any) => (
                      <div
                        key={w.id}
                        className="flex items-center gap-4 bg-[#1C1B1B] p-4 rounded-xl"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#0000CD]/10 flex items-center justify-center text-[#0000CD] font-black text-sm flex-shrink-0">
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

          {/* Моменты */}
          {settings?.show_moments && <MomentsBlock />}

          {/* Расписание */}
          {!settings?.show_moments &&
            settings?.show_schedule &&
            settings?.schedule?.length > 0 && (
              <section id="schedule" className="lg:col-span-2">
                <h2 className="text-2xl font-black uppercase tracking-tight mb-8">
                  Расписание <span className="text-[#0000CD]">стримов</span>
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
                      <p className="text-3xl font-black text-[#0000CD]">
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
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="text-xl font-black text-[#0000CD] uppercase">
              {name}
            </div>
            <p className="text-white/30 text-xs max-w-xs text-center md:text-left">
              © 2026 {name}. Все права защищены.
            </p>
          </div>

          <div className="flex gap-12">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">
                ИНФО
              </span>
              {settings?.show_rules && (
                <a
                  href="/rules"
                  className="text-white/50 hover:text-[#0000CD] transition-colors text-sm font-medium"
                >
                  ПРАВИЛА
                </a>
              )}
              <a
                href="/login"
                className="text-white/50 hover:text-[#0000CD] transition-colors text-sm font-medium"
              >
                ВОЙТИ
              </a>
              <a
                href="/register"
                className="text-white/50 hover:text-[#0000CD] transition-colors text-sm font-medium"
              >
                РЕГИСТРАЦИЯ
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">
                СОЦСЕТИ
              </span>
              {settings?.twitch_url && (
                <a
                  href={settings.twitch_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/50 hover:text-[#0000CD] transition-colors text-sm font-medium"
                >
                  TWITCH
                </a>
              )}
              {settings?.telegram_url && (
                <a
                  href={settings.telegram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/50 hover:text-[#0000CD] transition-colors text-sm font-medium"
                >
                  TELEGRAM
                </a>
              )}
              {settings?.vk_url && (
                <a
                  href={settings.vk_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/50 hover:text-[#0000CD] transition-colors text-sm font-medium"
                >
                  VK
                </a>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            {settings?.telegram_url && (
              <a
                href={settings.telegram_url}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-lg bg-[#1C1B1B] flex items-center justify-center hover:text-[#0000CD] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">send</span>
              </a>
            )}
            {settings?.twitch_url && (
              <a
                href={settings.twitch_url}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-lg bg-[#1C1B1B] flex items-center justify-center hover:text-[#0000CD] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">live_tv</span>
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
