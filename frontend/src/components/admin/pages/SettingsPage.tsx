import { useEffect, useState } from "react";
import client from "../../../api/client";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    client
      .get("/bots/settings/")
      .then((res) => setSettings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (field: string, value: string) =>
    setSettings((prev: any) => ({ ...prev, [field]: value }));

  if (loading) return <p className="text-white/40 text-sm">Загрузка...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
        НАСТРОЙКИ
      </h1>

      {saved && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl">
          ✅ Настройки сохранены
        </div>
      )}

      {/* Telegram бот */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
          Telegram бот
        </h2>

        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
            Приветствие (новый пользователь)
          </label>
          <textarea
            value={settings?.welcome_new || ""}
            onChange={(e) => set("welcome_new", e.target.value)}
            rows={3}
            className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40 resize-none font-mono"
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
            className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40 resize-none font-mono"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
            Текст кнопки участия
          </label>
          <input
            value={settings?.join_button_text || ""}
            onChange={(e) => set("join_button_text", e.target.value)}
            className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
          />
        </div>
      </div>

      {/* Канал */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
          Telegram канал
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
              ID канала
            </label>
            <input
              value={settings?.channel_id || ""}
              onChange={(e) => set("channel_id", e.target.value)}
              placeholder="-1001234567890"
              className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
              Username канала
            </label>
            <input
              value={settings?.channel_username || ""}
              onChange={(e) => set("channel_username", e.target.value)}
              placeholder="@mychannel"
              className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
            ID чата канала
          </label>
          <input
            value={settings?.chat_id || ""}
            onChange={(e) => set("chat_id", e.target.value)}
            placeholder="-1001234567891"
            className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
          />
        </div>
      </div>

      <button
        onClick={async () => {
          setSaving(true);
          setSaved(false);
          try {
            await client.patch("/bots/settings/update/", settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          } catch {}
          setSaving(false);
        }}
        disabled={saving}
        className="w-full py-3 bg-[#FFE100] text-[#211C00] font-bold rounded-xl uppercase tracking-widest text-sm hover:bg-[#FFE330] transition-colors disabled:opacity-50"
      >
        {saving ? "Сохраняем..." : "Сохранить настройки"}
      </button>
    </div>
  );
}
