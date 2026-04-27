import { useEffect, useState } from "react";
import client from "../../../api/client";

type Section = "bot" | "streamer" | "pages" | "schedule" | "rules";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState<Section>("streamer");
  const [newScheduleItem, setNewScheduleItem] = useState({
    day: "",
    time: "",
    note: "",
  });
  const [newFeature, setNewFeature] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    client
      .get("/bots/settings/")
      .then((res) => setSettings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (field: string, value: any) =>
    setSettings((prev: any) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { streamer_avatar_file, ...patchData } = settings;
      await client.patch("/bots/settings/update/", patchData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const addScheduleItem = () => {
    if (!newScheduleItem.day || !newScheduleItem.time) return;
    set("schedule", [...(settings?.schedule || []), newScheduleItem]);
    setNewScheduleItem({ day: "", time: "", note: "" });
  };

  const removeScheduleItem = (i: number) => {
    set(
      "schedule",
      settings.schedule.filter((_: any, idx: number) => idx !== i),
    );
  };

  const addFeature = () => {
    const val = newFeature.trim();
    if (!val) return;
    set("streamer_features", [...(settings?.streamer_features || []), val]);
    setNewFeature("");
  };

  const removeFeature = (i: number) => {
    set(
      "streamer_features",
      settings.streamer_features.filter((_: any, idx: number) => idx !== i),
    );
  };

  if (loading) return <p className="text-white/40 text-sm">Загрузка...</p>;

  const NAV: { id: Section; label: string; icon: string }[] = [
    { id: "streamer", label: "Стример", icon: "person" },
    { id: "pages", label: "Страницы сайта", icon: "web" },
    { id: "schedule", label: "Расписание", icon: "calendar_month" },
    { id: "bot", label: "Telegram бот", icon: "smart_toy" },
    { id: "rules", label: "Правила", icon: "gavel" },
  ];

  const avatarSrc =
    settings?.streamer_avatar_file || settings?.streamer_avatar_url || "";

  return (
    <div className="flex gap-8">
      {/* Левое меню */}
      <div className="w-48 flex-shrink-0">
        <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-3">
          Настройки
        </p>
        <div className="space-y-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors text-left ${
                section === item.id
                  ? "bg-[#9caffc]/10 text-[#9caffc] border-l-2 border-[#9caffc]"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 max-w-2xl space-y-6">
        {saved && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl">
            ✅ Настройки сохранены
          </div>
        )}

        {/* Стример */}
        {section === "streamer" && (
          <>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
              СТРИМЕР
            </h1>

            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Публичный профиль
              </h2>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  Имя стримера
                </label>
                <input
                  value={settings?.streamer_name || ""}
                  onChange={(e) => set("streamer_name", e.target.value)}
                  placeholder="Имя стримера"
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  Описание
                </label>
                <textarea
                  value={settings?.streamer_description || ""}
                  onChange={(e) => set("streamer_description", e.target.value)}
                  placeholder="Краткое описание для главной страницы"
                  rows={3}
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 resize-none"
                />
              </div>

              {/* Аватар */}
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                  Аватар
                </label>
                {avatarSrc && (
                  <div className="mb-3 flex items-center gap-3">
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className="w-16 h-16 rounded-xl object-cover border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        set("streamer_avatar_url", "");
                        set("streamer_avatar_file", null);
                        setAvatarError("");
                      }}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                )}
                {avatarError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-xl mb-3">
                    ⚠️ {avatarError}
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block mb-1.5">
                      Вариант 1 — Ссылка (URL)
                    </label>
                    <input
                      value={settings?.streamer_avatar_url || ""}
                      onChange={(e) => {
                        if (settings?.streamer_avatar_file) {
                          setAvatarError(
                            "Удали загруженный файл перед вводом URL",
                          );
                          return;
                        }
                        setAvatarError("");
                        set("streamer_avatar_url", e.target.value);
                      }}
                      placeholder="https://example.com/avatar.png"
                      className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                      или
                    </span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block mb-1.5">
                      Вариант 2 — Файл (JPG, PNG, WEBP, до 5 MB)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (settings?.streamer_avatar_url) {
                          setAvatarError("Удали URL перед загрузкой файла");
                          e.target.value = "";
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          setAvatarError("Файл не должен превышать 5 MB");
                          e.target.value = "";
                          return;
                        }
                        setAvatarError("");
                        setUploadingAvatar(true);
                        try {
                          const formData = new FormData();
                          formData.append("avatar", file);
                          const { data } = await client.post(
                            "/bots/avatar/upload/",
                            formData,
                            {
                              headers: {
                                "Content-Type": "multipart/form-data",
                              },
                            },
                          );
                          const base =
                            import.meta.env.VITE_API_URL?.replace("/api", "") ||
                            "http://localhost:8000";
                          set("streamer_avatar_file", `${base}${data.url}`);
                        } catch (err: any) {
                          setAvatarError(
                            err.response?.data?.error || "Ошибка загрузки",
                          );
                        } finally {
                          setUploadingAvatar(false);
                          e.target.value = "";
                        }
                      }}
                      className="w-full bg-[#1C1B1B] border border-white/5 text-white/60 px-4 py-3 rounded-xl file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#9caffc] file:text-[#FFFFFF] file:font-bold file:text-xs file:uppercase cursor-pointer"
                    />
                    {uploadingAvatar && (
                      <p className="text-xs text-white/40 mt-1 animate-pulse">
                        Загружаем...
                      </p>
                    )}
                    {avatarSrc && (
                      <div className="mt-4">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                          Фокус фото
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 w-32">
                          {[
                            ["top left", "top center", "top right"],
                            ["center left", "center center", "center right"],
                            ["bottom left", "bottom center", "bottom right"],
                          ]
                            .flat()
                            .map((pos) => (
                              <button
                                key={pos}
                                type="button"
                                onClick={() =>
                                  set("streamer_avatar_position", pos)
                                }
                                className={`w-9 h-9 rounded-lg border transition-colors ${(settings?.streamer_avatar_position || "center center") === pos ? "bg-[#9caffc] border-[#9caffc]" : "bg-[#1C1B1B] border-white/10 hover:border-white/30"}`}
                              />
                            ))}
                        </div>
                        <p className="text-[10px] text-white/20 mt-1.5">
                          Выбери где находится лицо на фото
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Преимущества */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Преимущества (страница входа)
              </h2>
              {(settings?.streamer_features || []).length > 0 && (
                <div className="space-y-2">
                  {(settings.streamer_features as string[]).map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-[#1C1B1B] rounded-xl px-4 py-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#9caffc] flex-shrink-0" />
                      <span className="text-sm text-white flex-1">{text}</span>
                      <button
                        onClick={() => removeFeature(i)}
                        className="text-white/20 hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">
                          close
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                  placeholder="Розыгрыши каждый стрим"
                  className="flex-1 bg-[#1C1B1B] border border-white/5 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                />
                <button
                  onClick={addFeature}
                  className="px-4 py-2.5 bg-[#1C1B1B] border border-white/10 text-white/60 text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-[#2A2A2A] transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-[10px] text-white/20">
                Enter или кнопка + чтобы добавить
              </p>
            </div>

            {/* Социальные сети */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Социальные сети
              </h2>
              {[
                {
                  field: "twitch_url",
                  label: "Twitch",
                  placeholder: "https://twitch.tv/ваш_ник",
                },
                {
                  field: "telegram_url",
                  label: "Telegram",
                  placeholder: "https://t.me/ваш_канал",
                },
                {
                  field: "vk_url",
                  label: "VK",
                  placeholder: "https://vk.com/ваш_профиль",
                },
                {
                  field: "youtube_url",
                  label: "YouTube",
                  placeholder: "https://youtube.com/@ваш_канал",
                },
              ].map((item) => (
                <div key={item.field}>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                    {item.label}
                  </label>
                  <input
                    value={settings?.[item.field] || ""}
                    onChange={(e) => set(item.field, e.target.value)}
                    placeholder={item.placeholder}
                    className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Страницы сайта */}
        {section === "pages" && (
          <>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
              СТРАНИЦЫ САЙТА
            </h1>
            <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
              {[
                {
                  field: "show_giveaways",
                  label: "Активные розыгрыши",
                  desc: "Блок на главной странице",
                },
                {
                  field: "show_winners",
                  label: "Последние победители",
                  desc: "Блок на главной странице",
                },
                {
                  field: "show_schedule",
                  label: "Расписание (блок)",
                  desc: "Блок расписания на главной странице",
                },
                {
                  field: "show_schedule_page",
                  label: "Страница расписания",
                  desc: "Страница /schedule",
                },
                {
                  field: "show_moments",
                  label: "Лучшие моменты",
                  desc: "Страница /moments",
                },
                {
                  field: "show_rules",
                  label: "Правила сообщества",
                  desc: "Страница /rules",
                },
                {
                  field: "show_status_page",
                  label: "Статус платформы",
                  desc: "Страница /status",
                },
              ].map((item, i) => (
                <div
                  key={item.field}
                  className={`flex items-center justify-between p-5 ${i > 0 ? "border-t border-white/5" : ""}`}
                >
                  <div>
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => set(item.field, !settings?.[item.field])}
                    className={`w-10 h-5 rounded-full relative transition-colors ${settings?.[item.field] ? "bg-[#9caffc]/80" : "bg-[#2A2A2A]"}`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${settings?.[item.field] ? "right-0.5" : "left-0.5 opacity-30"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Расписание */}
        {section === "schedule" && (
          <>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
              РАСПИСАНИЕ
            </h1>
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Расписание стримов
              </h2>
              {settings?.schedule?.length > 0 && (
                <div className="space-y-2 mb-4">
                  {settings.schedule.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-[#1C1B1B] rounded-xl px-4 py-3"
                    >
                      <span className="text-sm font-bold text-[#9caffc] w-24">
                        {item.day}
                      </span>
                      <span className="text-sm text-white">{item.time}</span>
                      {item.note && (
                        <span className="text-xs text-white/40 flex-1">
                          {item.note}
                        </span>
                      )}
                      <button
                        onClick={() => removeScheduleItem(i)}
                        className="text-white/20 hover:text-red-400 transition-colors ml-auto"
                      >
                        <span className="material-symbols-outlined text-base">
                          close
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <input
                  value={newScheduleItem.day}
                  onChange={(e) =>
                    setNewScheduleItem((p) => ({ ...p, day: e.target.value }))
                  }
                  placeholder="Пн / Вторник"
                  className="bg-[#1C1B1B] border border-white/5 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                />
                <input
                  value={newScheduleItem.time}
                  onChange={(e) =>
                    setNewScheduleItem((p) => ({ ...p, time: e.target.value }))
                  }
                  placeholder="20:00"
                  className="bg-[#1C1B1B] border border-white/5 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                />
                <input
                  value={newScheduleItem.note}
                  onChange={(e) =>
                    setNewScheduleItem((p) => ({ ...p, note: e.target.value }))
                  }
                  placeholder="CS2, Just Chatting..."
                  className="bg-[#1C1B1B] border border-white/5 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                />
              </div>
              <button
                onClick={addScheduleItem}
                className="w-full py-2.5 bg-[#1C1B1B] border border-white/10 text-white/60 text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-[#2A2A2A] transition-colors"
              >
                + Добавить день
              </button>
            </div>
          </>
        )}

        {/* Telegram бот */}
        {section === "bot" && (
          <>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
              TELEGRAM БОТ
            </h1>
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Тексты
              </h2>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  Приветствие (новый пользователь)
                </label>
                <textarea
                  value={settings?.welcome_new || ""}
                  onChange={(e) => set("welcome_new", e.target.value)}
                  rows={3}
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 resize-none font-mono"
                />
                <p className="text-[10px] text-white/20 mt-1">
                  Переменные: {"{name}"}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  Приветствие (возвращающийся)
                </label>
                <textarea
                  value={settings?.welcome_back || ""}
                  onChange={(e) => set("welcome_back", e.target.value)}
                  rows={2}
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 resize-none font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  Текст кнопки участия
                </label>
                <input
                  value={settings?.join_button_text || ""}
                  onChange={(e) => set("join_button_text", e.target.value)}
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                />
              </div>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Telegram канал
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    field: "channel_id",
                    label: "ID канала",
                    placeholder: "-1001234567890",
                  },
                  {
                    field: "channel_username",
                    label: "Username канала",
                    placeholder: "@mychannel",
                  },
                  {
                    field: "chat_id",
                    label: "ID чата канала",
                    placeholder: "-1001234567891",
                  },
                ].map((item) => (
                  <div key={item.field}>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                      {item.label}
                    </label>
                    <input
                      value={settings?.[item.field] || ""}
                      onChange={(e) => set(item.field, e.target.value)}
                      placeholder={item.placeholder}
                      className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Правила */}
        {section === "rules" && (
          <>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
              ПРАВИЛА
            </h1>

            {/* Правила чата */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Правила чата
              </h2>
              {(settings?.rules_chat || []).map((text: string, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-[#1C1B1B] rounded-xl px-4 py-3"
                >
                  <span className="text-[#9caffc] font-black text-sm w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-white flex-1">{text}</span>
                  <button
                    onClick={() =>
                      set(
                        "rules_chat",
                        settings.rules_chat.filter(
                          (_: any, idx: number) => idx !== i,
                        ),
                      )
                    }
                    className="text-white/20 hover:text-red-400 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">
                      close
                    </span>
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  id="chat-rule-input"
                  placeholder="Новое правило чата"
                  className="flex-1 bg-[#1C1B1B] border border-white/5 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (!val) return;
                    set("rules_chat", [...(settings?.rules_chat || []), val]);
                    (e.target as HTMLInputElement).value = "";
                  }}
                />
                <button
                  onClick={() => {
                    const el = document.getElementById(
                      "chat-rule-input",
                    ) as HTMLInputElement;
                    const val = el?.value.trim();
                    if (!val) return;
                    set("rules_chat", [...(settings?.rules_chat || []), val]);
                    el.value = "";
                  }}
                  className="px-4 py-2.5 bg-[#1C1B1B] border border-white/10 text-white/60 text-xs font-bold rounded-xl hover:bg-[#2A2A2A] transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-[10px] text-white/20">
                Enter или кнопка + чтобы добавить
              </p>
            </div>

            {/* Правила розыгрышей */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Правила розыгрышей
              </h2>
              {(settings?.rules_giveaway || []).map(
                (text: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-[#1C1B1B] rounded-xl px-4 py-3"
                  >
                    <span className="material-symbols-outlined text-[#9caffc] text-base">
                      check_circle
                    </span>
                    <span className="text-sm text-white flex-1">{text}</span>
                    <button
                      onClick={() =>
                        set(
                          "rules_giveaway",
                          settings.rules_giveaway.filter(
                            (_: any, idx: number) => idx !== i,
                          ),
                        )
                      }
                      className="text-white/20 hover:text-red-400 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">
                        close
                      </span>
                    </button>
                  </div>
                ),
              )}
              <div className="flex gap-2">
                <input
                  id="giveaway-rule-input"
                  placeholder="Новое правило розыгрыша"
                  className="flex-1 bg-[#1C1B1B] border border-white/5 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (!val) return;
                    set("rules_giveaway", [
                      ...(settings?.rules_giveaway || []),
                      val,
                    ]);
                    (e.target as HTMLInputElement).value = "";
                  }}
                />
                <button
                  onClick={() => {
                    const el = document.getElementById(
                      "giveaway-rule-input",
                    ) as HTMLInputElement;
                    const val = el?.value.trim();
                    if (!val) return;
                    set("rules_giveaway", [
                      ...(settings?.rules_giveaway || []),
                      val,
                    ]);
                    el.value = "";
                  }}
                  className="px-4 py-2.5 bg-[#1C1B1B] border border-white/10 text-white/60 text-xs font-bold rounded-xl hover:bg-[#2A2A2A] transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-[10px] text-white/20">
                Enter или кнопка + чтобы добавить
              </p>
            </div>

            {/* Система наказаний */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Система наказаний
              </h2>
              {(settings?.rules_punishments || []).map(
                (row: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-[#1C1B1B] rounded-xl px-4 py-3"
                  >
                    <span className="text-sm text-white flex-1">
                      {row.violation}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                        row.type === "Ban"
                          ? "bg-red-600 text-white"
                          : row.type === "Mute"
                            ? "bg-orange-500 text-black"
                            : "bg-[#9caffc] text-[#0a0a0a]"
                      }`}
                    >
                      {row.type}
                    </span>
                    <span className="text-xs text-white/40 w-36 text-right">
                      {row.duration}
                    </span>
                    <button
                      onClick={() =>
                        set(
                          "rules_punishments",
                          settings.rules_punishments.filter(
                            (_: any, idx: number) => idx !== i,
                          ),
                        )
                      }
                      className="text-white/20 hover:text-red-400 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">
                        close
                      </span>
                    </button>
                  </div>
                ),
              )}
              <div className="grid grid-cols-3 gap-2">
                <input
                  id="p-violation"
                  placeholder="Нарушение"
                  className="bg-[#1C1B1B] border border-white/5 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                />
                <select
                  id="p-type"
                  className="bg-[#1C1B1B] border border-white/5 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                >
                  <option value="Warning">Warning</option>
                  <option value="Mute">Mute</option>
                  <option value="Ban">Ban</option>
                </select>
                <input
                  id="p-duration"
                  placeholder="Срок"
                  className="bg-[#1C1B1B] border border-white/5 text-white text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                />
              </div>
              <button
                onClick={() => {
                  const violation = (
                    document.getElementById("p-violation") as HTMLInputElement
                  )?.value.trim();
                  const type = (
                    document.getElementById("p-type") as HTMLSelectElement
                  )?.value;
                  const duration = (
                    document.getElementById("p-duration") as HTMLInputElement
                  )?.value.trim();
                  if (!violation || !duration) return;
                  set("rules_punishments", [
                    ...(settings?.rules_punishments || []),
                    { violation, type, duration },
                  ]);
                  (
                    document.getElementById("p-violation") as HTMLInputElement
                  ).value = "";
                  (
                    document.getElementById("p-duration") as HTMLInputElement
                  ).value = "";
                }}
                className="w-full py-2.5 bg-[#1C1B1B] border border-white/10 text-white/60 text-xs font-bold rounded-xl uppercase tracking-widest hover:bg-[#2A2A2A] transition-colors"
              >
                + Добавить наказание
              </button>
            </div>

            {/* Текст апелляций */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Текст апелляций
              </h2>
              <textarea
                value={settings?.rules_appeals_text || ""}
                onChange={(e) => set("rules_appeals_text", e.target.value)}
                rows={3}
                className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 resize-none"
              />
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-[#9caffc] text-[#0a0a0a] font-bold rounded-xl uppercase tracking-widest text-sm hover:bg-[#7b94f8] transition-colors disabled:opacity-50"
        >
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
