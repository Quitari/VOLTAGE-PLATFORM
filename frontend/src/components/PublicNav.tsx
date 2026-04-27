import { useNavigate } from "react-router-dom";

interface Props {
  settings: any;
  currentPath: string;
}

export default function PublicNav({ settings, currentPath }: Props) {
  const navigate = useNavigate();
  const name = settings?.streamer_name || "VOLTAGE";

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
    <nav className="fixed top-0 w-full z-50 h-20 bg-[#0E0E0E]/90 backdrop-blur-md flex justify-between items-center px-8 border-b border-white/5">
      <button
        onClick={() => navigate("/")}
        className="text-2xl font-black tracking-tighter text-[#0000CD] uppercase hover:opacity-80 transition-opacity"
      >
        {name}
      </button>
      <div className="hidden md:flex gap-8 items-center">
        {navItems.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <a
              key={item.href}
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
        className="bg-[#0000CD] text-[#FFFFFF] px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#1A1AE8] transition-colors"
      >
        ВОЙТИ
      </button>
    </nav>
  );
}
