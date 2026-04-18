export default function NotificationsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
          Уведомле<span className="text-[#FFE100]">ния</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Управляй тем, как получаешь обновления
        </p>
      </div>

      {/* Telegram */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-[#24A1DE]">send</span>
          <h2 className="text-lg font-black uppercase tracking-tight">
            Уведомления в Telegram
          </h2>
        </div>
        <p className="text-white/40 text-sm">
          Уведомления приходят автоматически через Telegram бота если аккаунт
          привязан.
        </p>
        {[
          { label: "Начало стрима", desc: "Когда стример выходит в эфир" },
          { label: "Результаты розыгрышей", desc: "Кто победил в розыгрыше" },
          { label: "Я выиграл приз", desc: "Мгновенное уведомление о победе" },
          { label: "Статус доставки", desc: "Изменения статуса твоего приза" },
          {
            label: "Новое наказание",
            desc: "Информация о муте или предупреждении",
          },
          { label: "Ответ на апелляцию", desc: "Решение по твоей заявке" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between py-3 border-t border-white/5"
          >
            <div>
              <p className="text-sm font-bold text-white">{item.label}</p>
              <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
            </div>
            <div className="w-10 h-5 rounded-full bg-[#FFE100]/80 relative flex-shrink-0">
              <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#211C00] rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Push — roadmap */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 opacity-60">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-white/40">
            laptop_mac
          </span>
          <h2 className="text-lg font-black uppercase tracking-tight text-white/60">
            Push-уведомления в браузере
          </h2>
          <span className="text-[10px] font-bold bg-white/10 text-white/40 px-2 py-1 rounded-lg uppercase">
            Скоро
          </span>
        </div>
        <p className="text-white/30 text-sm">
          Браузерные уведомления появятся в следующих обновлениях платформы.
        </p>
      </div>
    </div>
  );
}
