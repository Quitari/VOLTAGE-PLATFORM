import { useState } from "react";
import { useAuthStore } from "../../store/auth";
import client from "../../api/client";

export default function DashboardSettingsPage() {
  const { user, loadUser } = useAuthStore();
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await client.patch("/auth/profile/", form);
      await loadUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      const data = err.response?.data;
      if (typeof data === "object") {
        const first = Object.values(data)[0];
        setError(Array.isArray(first) ? (first[0] as string) : String(first));
      } else {
        setError("Ошибка сохранения");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
          Насто<span className="text-[#FFE100]">йки</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">Основные данные аккаунта</p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl">
          ✅ Изменения сохранены
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-5">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
          Профиль
        </h2>

        {/* Аватар — инициалы */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1C1B1B] flex items-center justify-center text-[#FFE100] font-black text-xl">
            {user?.username?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{user?.username}</p>
            <p className="text-xs text-white/40 mt-0.5">
              {user?.roles?.length
                ? user.roles.reduce((p: any, c: any) =>
                    c.role.level > p.role.level ? c : p,
                  ).role.name
                : "Участник"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
              Никнейм
            </label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
              className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#FFE100] text-[#211C00] py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-[#FFE330] transition-colors disabled:opacity-50"
        >
          {saving ? "Сохраняем..." : "Сохранить изменения"}
        </button>
      </div>

      {/* Дата регистрации */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
          Информация
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-white/40">Дата регистрации</span>
            <span className="text-white">{user?.created_at?.slice(0, 10)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">ID аккаунта</span>
            <span className="text-white/60 font-mono text-xs">
              {user?.id?.slice(0, 8)}...
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Статус</span>
            <span className="text-green-400 font-bold uppercase text-xs">
              {user?.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
