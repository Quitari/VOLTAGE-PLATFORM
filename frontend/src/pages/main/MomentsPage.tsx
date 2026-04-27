import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import PublicNav from "../../components/PublicNav";

interface Clip {
  id: string;
  title: string;
  url: string;
  game: string;
  preview_url: string;
  created_at: string;
  submitted_by: string | null;
}

export default function MomentsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("");

  useEffect(() => {
    document.title = "Моменты — VOLTAGE";
    Promise.all([client.get("/bots/settings/"), client.get("/clips/")])
      .then(([s, c]) => {
        setSettings(s.data);
        setClips(c.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const streamerName = settings?.streamer_name || "VOLTAGE";

  const navItems = [
    { label: "Главная", href: "/", show: true },
    {
      label: "Расписание",
      href: "#schedule",
      show: !!(settings?.show_schedule && settings?.schedule?.length > 0),
    },
    { label: "Моменты", href: "/moments", show: !!settings?.show_moments },
    { label: "Правила", href: "/rules", show: !!settings?.show_rules },
  ].filter((item) => item.show);

  const games = Array.from(new Set(clips.map((c) => c.game).filter(Boolean)));

  const filtered = clips.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchGame = gameFilter ? c.game === gameFilter : true;
    return matchSearch && matchGame;
  });

  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-white"
      style={{ fontFamily: "Manrope, sans-serif" }}
    >
      <PublicNav settings={settings} currentPath="/moments" />

      <main className="pt-28 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-10">
          <section>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white leading-none">
              ЛУЧШИЕ <span className="text-[#0000CD]">МОМЕНТЫ</span>
            </h1>
            <p className="text-lg text-white/50 mt-4 max-w-2xl leading-relaxed">
              Лучшие клипы и моменты со стримов — предложенные сообществом.
            </p>
          </section>

          <section className="flex flex-wrap items-center gap-4 bg-[#111] border border-white/5 p-4 rounded-2xl">
            <div className="flex flex-wrap gap-3 flex-1">
              <select
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                className="bg-[#1C1B1B] border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#0000CD]/40"
              >
                <option value="">Все игры</option>
                {games.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-lg">
                  search
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по названию..."
                  className="w-full bg-[#1C1B1B] border border-white/10 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-[#0000CD]/40"
                />
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard?suggest=clip")}
              className="bg-[#0000CD] text-[#FFFFFF] px-6 py-2.5 rounded-xl font-bold text-sm uppercase hover:bg-[#1A1AE8] transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Предложить клип
            </button>
          </section>

          {loading ? (
            <div className="text-center py-20 text-white/30">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-[#111] border border-white/5 rounded-2xl p-16 text-center">
              <span className="material-symbols-outlined text-white/10 text-7xl block mb-4">
                movie
              </span>
              <p className="text-white/40 text-lg font-bold uppercase">
                Клипов пока нет
              </p>
              <p className="text-white/20 text-sm mt-2">
                Стань первым — предложи клип из стрима
              </p>
              <button
                onClick={() => navigate("/dashboard?suggest=clip")}
                className="mt-6 bg-[#0000CD] text-[#FFFFFF] px-6 py-3 rounded-xl font-bold text-sm uppercase hover:bg-[#1A1AE8] transition-colors"
              >
                Предложить клип
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.map((clip) => (
                <article
                  key={clip.id}
                  className="group cursor-pointer"
                  onClick={() => window.open(clip.url, "_blank")}
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-[#1C1B1B]">
                    {clip.preview_url ? (
                      <img
                        src={clip.preview_url}
                        alt={clip.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span
                          className="material-symbols-outlined text-white/10"
                          style={{ fontSize: "48px" }}
                        >
                          movie
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-[#0000CD] text-[#FFFFFF] w-14 h-14 rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform">
                        <span
                          className="material-symbols-outlined text-3xl"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          play_arrow
                        </span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-sm leading-tight mb-1 group-hover:text-[#0000CD] transition-colors line-clamp-2">
                    {clip.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    {clip.game && <span>{clip.game}</span>}
                    {clip.game && clip.submitted_by && (
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                    )}
                    {clip.submitted_by && <span>{clip.submitted_by}</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <div className="fixed top-0 right-0 w-1/3 h-full bg-[#0000CD]/5 blur-[120px] -z-10 pointer-events-none" />
    </div>
  );
}
