import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";

const DEFAULT_CHAT_RULES = [
  "Проявляйте уважение ко всем участникам сообщества и стримеру.",
  "Запрещен спам, флуд и злоупотребление CAPS LOCK.",
  "Любая реклама сторонних ресурсов и услуг строго запрещена.",
  "Запрещено разжигание ненависти, дискриминация и токсичное поведение.",
  "Споры с модераторами в общем чате недопустимы.",
  "Запрещена публикация личной информации других пользователей (Doxing).",
  "Не допускается обсуждение политики и религии в агрессивной форме.",
  "Придерживайтесь тематики трансляции и заданных категорий.",
];

const DEFAULT_GIVEAWAY_RULES = [
  "Один аккаунт на одного реального пользователя.",
  "Использование ботов ведет к перманентному бану.",
  "Призы выдаются только при выполнении всех условий.",
  "Fair Play: любые манипуляции результатом запрещены.",
];

const DEFAULT_PUNISHMENTS = [
  {
    violation: "Мелкий флуд, спам символами",
    type: "Warning",
    duration: "Предупреждение",
  },
  {
    violation: "Оскорбление участников сообщества",
    type: "Mute",
    duration: "от 1 часа до 24 часов",
  },
  {
    violation: "Реклама, ссылки на вредоносное ПО",
    type: "Ban",
    duration: "Перманентно",
  },
  {
    violation: "Разжигание межнациональной розни",
    type: "Ban",
    duration: "от 7 дней до Перманентно",
  },
  {
    violation: "Обход системы наказаний (мультиакк)",
    type: "Ban",
    duration: "Перманентно всех аккаунтов",
  },
];

const DEFAULT_APPEALS_TEXT =
  "Если вы считаете, что наказание было выдано по ошибке, вы можете подать запрос на пересмотр дела. Модераторы рассмотрят вашу заявку в течение 48 часов.";

const PUNISHMENT_COLOR: Record<string, string> = {
  Warning: "bg-[#FFE100] text-[#211C00]",
  Mute: "bg-orange-500 text-black",
  Ban: "bg-red-600 text-white",
};

const SIDEBAR = [
  { icon: "chat", label: "Чат", anchor: "#chat" },
  { icon: "redeem", label: "Розыгрыши", anchor: "#giveaways" },
  { icon: "gavel", label: "Наказания", anchor: "#punishments" },
  { icon: "description", label: "Апелляции", anchor: "#appeals" },
];

export default function RulesPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    document.title = "Правила — VOLTAGE";
    client
      .get("/bots/settings/")
      .then((r) => setSettings(r.data))
      .catch(() => {});
  }, []);

  const chatRules: string[] = settings?.rules_chat?.length
    ? settings.rules_chat
    : DEFAULT_CHAT_RULES;
  const giveawayRules: string[] = settings?.rules_giveaway?.length
    ? settings.rules_giveaway
    : DEFAULT_GIVEAWAY_RULES;
  const punishments = settings?.rules_punishments?.length
    ? settings.rules_punishments
    : DEFAULT_PUNISHMENTS;
  const appealsText: string =
    settings?.rules_appeals_text || DEFAULT_APPEALS_TEXT;
  const streamerName: string = settings?.streamer_name || "VOLTAGE";

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
          <a
            href="/"
            className="text-white/70 hover:text-white transition-colors font-bold uppercase text-sm"
          >
            Главная
          </a>
          {settings?.show_schedule && settings?.schedule?.length > 0 && (
            <a
              href="/#schedule"
              className="text-white/70 hover:text-white transition-colors font-bold uppercase text-sm"
            >
              Расписание
            </a>
          )}
          {settings?.show_moments && (
            <a
              href="/#moments"
              className="text-white/70 hover:text-white transition-colors font-bold uppercase text-sm"
            >
              Моменты
            </a>
          )}
          <a
            href="/rules"
            className="text-[#FFE100] border-b-2 border-[#FFE100] pb-1 font-bold uppercase text-sm"
          >
            Правила
          </a>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="bg-[#FFE100] text-[#211C00] px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#FFE330] transition-colors"
        >
          ВОЙТИ
        </button>
      </nav>

      {/* Sidebar */}
      <aside className="fixed left-0 top-20 h-[calc(100vh-80px)] w-56 bg-[#0E0E0E] flex-col py-8 hidden md:flex border-r border-white/5">
        <div className="px-6 mb-6">
          <p className="text-[10px] font-bold text-[#FFE100] uppercase tracking-widest">
            Категории
          </p>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
            Регламент платформы
          </p>
        </div>
        <div className="flex flex-col">
          {SIDEBAR.map((item, i) => (
            <a
              key={item.anchor}
              href={item.anchor}
              className={`flex items-center px-6 py-4 font-bold uppercase text-sm transition-all ${
                i === 0
                  ? "bg-[#FFE100] text-[#211C00]"
                  : "text-white/50 hover:text-white hover:bg-[#1C1B1B] hover:translate-x-1"
              }`}
            >
              <span className="material-symbols-outlined mr-3 text-xl">
                {item.icon}
              </span>
              {item.label}
            </a>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="pt-28 pb-20 md:ml-56 px-6 md:px-12">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Hero */}
          <section>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white leading-none">
              ПРАВИЛА <span className="text-[#FFE100]">СООБЩЕСТВА</span>
            </h1>
            <p className="text-lg text-white/50 mt-4 max-w-2xl leading-relaxed">
              Соблюдение этих правил обязательно для всех участников. Незнание
              правил не освобождает от ответственности.
            </p>
          </section>

          {/* Чат + Розыгрыши */}
          <section id="chat" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Правила чата */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-[#FFE100] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[#211C00]">
                    chat
                  </span>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  Правила чата
                </h2>
              </div>
              <div className="space-y-4">
                {chatRules.map((rule, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-[#FFE100] font-black text-lg italic w-8 flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Правила розыгрышей */}
            <div
              id="giveaways"
              className="bg-[#1C1B1B] border border-white/5 rounded-2xl p-8 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-[#FFE100] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[#211C00]">
                      redeem
                    </span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">
                    Правила розыгрышей
                  </h2>
                </div>
                <ul className="space-y-4">
                  {giveawayRules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#FFE100] text-lg flex-shrink-0">
                        check_circle
                      </span>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {rule}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-xs text-white/30 italic">
                  Администрация оставляет за собой право пересмотреть итоги в
                  случае подозрений в обмане.
                </p>
              </div>
            </div>
          </section>

          {/* Система наказаний */}
          <section id="punishments" className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#FFE100] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[#211C00]">
                  gavel
                </span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight">
                Система наказаний
              </h2>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#0E0E0E]">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#FFE100]">
                      Нарушение
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#FFE100]">
                      Наказание
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#FFE100]">
                      Срок
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {punishments.map((row: any, i: number) => (
                    <tr
                      key={i}
                      className="hover:bg-[#1C1B1B] transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium">
                        {row.violation}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-[10px] font-black uppercase rounded ${PUNISHMENT_COLOR[row.type] || "bg-white/10 text-white"}`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/50">
                        {row.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Апелляции */}
          <section
            id="appeals"
            className="bg-[#FFE100] rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="space-y-2 max-w-xl">
              <h2 className="text-4xl font-black uppercase text-[#211C00] leading-none">
                Апелляции
              </h2>
              <p className="text-[#211C00]/70 font-medium text-sm leading-relaxed">
                {appealsText}
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-[#211C00] text-[#FFE100] px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
            >
              Подать апелляцию
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </section>

          {/* Footer stamp */}
          <footer className="pt-4 opacity-20 flex justify-between items-center">
            <div className="text-4xl font-black uppercase tracking-tighter">
              {streamerName}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest">
              2026 VOLTAGE PLATFORM
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
