import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";

export default function MomentsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    document.title = "Моменты — VOLTAGE";
    client
      .get("/bots/settings/")
      .then((r) => setSettings(r.data))
      .catch(() => {});
  }, []);

  const streamerName = settings?.streamer_name || "VOLTAGE";

  const navItems = [
    { label: "Главная", href: "/", show: true },
    {
      label: "Расписание",
      href: "/",
      show: !!(settings?.show_schedule && settings?.schedule?.length > 0),
    },
    { label: "Моменты", href: "/moments", show: !!settings?.show_moments },
    { label: "Правила", href: "/rules", show: !!settings?.show_rules },
  ].filter((item) => item.show);

  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-white"
      style={{ fontFamily: "Manrope, sans-serif" }}
    >
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 h-20 bg-[#0E0E0E]/90 backdrop-blur-md flex justify-between items-center px-8 border-b border-white/5">
        <button
          onClick={() => navigate("/")}
          className="text-2xl font-black tracking-tighter text-[#FFE100] uppercase"
        >
          {streamerName}
        </button>
        <div className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => {
            const isActive = window.location.pathname === item.href;
            return (
              <a
                key={item.label}
                href={item.href}
                className={`font-bold uppercase text-sm transition-colors ${
                  isActive
                    ? "text-[#FFE100] border-b-2 border-[#FFE100] pb-1"
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
          className="bg-[#FFE100] text-[#211C00] px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#FFE330] transition-colors"
        >
          ВОЙТИ
        </button>
      </nav>

      {/* Main */}
      <main className="pt-28 pb-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero */}
          <section>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white leading-none">
              ЛУЧШИЕ <span className="text-[#FFE100]">МОМЕНТЫ</span>
            </h1>
            <p className="text-lg text-white/50 mt-4 max-w-2xl leading-relaxed">
              Лучшие клипы и моменты со стримов.
            </p>
          </section>

          {/* Сетка моментов */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="group relative rounded-2xl overflow-hidden aspect-video bg-[#1C1B1B] cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-white/10"
                    style={{ fontSize: "64px" }}
                  >
                    play_circle
                  </span>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold">
                  0:00
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                  <p className="text-sm font-bold uppercase">
                    Добавь момент в настройках
                  </p>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
