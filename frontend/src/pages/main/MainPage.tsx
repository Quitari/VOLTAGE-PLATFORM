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
        <div className="text-white/40 text-sm">Загрузка...</div>
      </div>
    );

  const name = settings?.streamer_name || "VOLTAGE";
  const description =
    settings?.streamer_description || "Платформа для стримеров";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-white/5 px-8 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#FFE100] tracking-tighter uppercase">
          VOLTAGE
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs font-bold text-white/60 hover:text-white uppercase tracking-widest transition-colors"
          >
            Личный кабинет
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-[#FFE100] text-[#211C00] text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-[#FFE330] transition-colors"
          >
            Войти
          </button>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-8 py-20 text-center">
        {settings?.streamer_avatar_url && (
          <img
            src={settings.streamer_avatar_url}
            alt={name}
            className="w-24 h-24 rounded-2xl mx-auto mb-6 object-cover"
          />
        )}
        <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">
          {name}
        </h2>
        <p className="text-white/60 text-lg max-w-xl mx-auto mb-8">
          {description}
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          {settings?.twitch_url && (
            <a
              href={settings.twitch_url}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-[#9146FF]/20 text-[#9146FF] font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-[#9146FF]/30 transition-colors"
            >
              Twitch
            </a>
          )}
          {settings?.telegram_url && (
            <a
              href={settings.telegram_url}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-[#24A1DE]/20 text-[#24A1DE] font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-[#24A1DE]/30 transition-colors"
            >
              Telegram
            </a>
          )}
          {settings?.vk_url && (
            <a
              href={settings.vk_url}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-[#4C75A3]/20 text-[#4C75A3] font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-[#4C75A3]/30 transition-colors"
            >
              VK
            </a>
          )}
          {settings?.youtube_url && (
            <a
              href={settings.youtube_url}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-red-500/20 text-red-400 font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-red-500/30 transition-colors"
            >
              YouTube
            </a>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-8 pb-20 space-y-16">
        {settings?.show_giveaways !== false && giveaways.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6">
              Активные розыгрыши
            </h3>
            <div className="grid gap-4">
              {giveaways.map((g) => (
                <div
                  key={g.id}
                  className="bg-[#111] border border-white/5 rounded-2xl p-6 flex items-center justify-between"
                >
                  <div>
                    <p className="font-black text-white text-lg">{g.title}</p>
                    {g.skin_name && (
                      <p className="text-white/40 text-sm mt-1">
                        {g.skin_name}
                      </p>
                    )}
                    <p className="text-white/40 text-xs mt-2">
                      {g.participants_count} участников
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/login")}
                    className="px-5 py-2.5 bg-[#FFE100] text-[#211C00] font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-[#FFE330] transition-colors"
                  >
                    Участвовать
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {settings?.show_winners !== false && winners.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6">
              Последние победители
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {winners.slice(0, 6).map((g) =>
                g.winners?.map((w: any) => (
                  <div
                    key={w.id}
                    className="bg-[#111] border border-white/5 rounded-2xl p-4 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FFE100]/10 flex items-center justify-center text-[#FFE100] font-black text-xs flex-shrink-0">
                      {w.user?.username?.slice(0, 2).toUpperCase() || "??"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {w.user?.username || "—"}
                      </p>
                      <p className="text-xs text-white/40 truncate">
                        {g.title}
                      </p>
                    </div>
                  </div>
                )),
              )}
            </div>
          </section>
        )}

        {settings?.show_schedule !== false &&
          settings?.schedule?.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6">
                Расписание стримов
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {settings.schedule.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="bg-[#111] border border-white/5 rounded-2xl p-4 text-center"
                  >
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">
                      {item.day}
                    </p>
                    <p className="text-lg font-black text-[#FFE100]">
                      {item.time}
                    </p>
                    {item.note && (
                      <p className="text-xs text-white/40 mt-1">{item.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
      </div>

      <footer className="border-t border-white/5 px-8 py-6 text-center">
        <p className="text-white/20 text-xs">
          2026 {name} · Powered by VOLTAGE Platform
        </p>
        <div className="flex items-center justify-center gap-4 mt-3">
          {settings?.show_rules && (
            <a
              href="/rules"
              className="text-xs text-white/30 hover:text-white transition-colors"
            >
              Правила
            </a>
          )}
          <a
            href="/login"
            className="text-xs text-white/30 hover:text-white transition-colors"
          >
            Войти
          </a>
        </div>
      </footer>
    </div>
  );
}
