import { useEffect, useState } from "react";
import client from "../../../api/client";

export default function CommandsPage() {
  const [commands, setCommands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", response: "", cooldown: 5 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    client
      .get("/bots/commands/")
      .then((res) => setCommands(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", response: "", cooldown: 5 });
    setError("");
    setShowForm(true);
  };

  const openEdit = (cmd: any) => {
    setEditId(cmd.id);
    setForm({ name: cmd.name, response: cmd.response, cooldown: cmd.cooldown });
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.response.trim()) {
      setError("Заполни все поля");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editId) {
        await client.patch(`/bots/commands/${editId}/`, form);
      } else {
        await client.post("/bots/commands/create/", form);
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await client.delete(`/bots/commands/${id}/`);
      load();
    } catch {}
  };

  const handleToggle = async (cmd: any) => {
    try {
      await client.patch(`/bots/commands/${cmd.id}/`, {
        is_active: !cmd.is_active,
      });
      load();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Модалка */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                {editId ? "Редактировать" : "Новая команда"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                Название команды
              </label>
              <div className="flex items-center gap-2">
                <span className="text-white/40 font-bold text-lg">!</span>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      name: e.target.value.replace(/^!+/, ""),
                    }))
                  }
                  placeholder="discord"
                  className="flex-1 bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                Ответ бота
              </label>
              <textarea
                value={form.response}
                onChange={(e) =>
                  setForm((p) => ({ ...p, response: e.target.value }))
                }
                placeholder="Наш Discord: discord.gg/example"
                rows={3}
                className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40 resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                Кулдаун (секунды)
              </label>
              <input
                type="number"
                min={0}
                max={300}
                value={form.cooldown}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    cooldown: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 bg-[#1C1B1B] text-white/60 font-bold rounded-xl uppercase tracking-widest text-xs"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-[#FFE100] text-[#211C00] font-bold rounded-xl uppercase tracking-widest text-xs disabled:opacity-50"
              >
                {saving ? "Сохраняем..." : editId ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
            КОМАНДЫ TWITCH
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Команд: {commands.length}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-6 py-2.5 bg-[#FFE100] text-[#211C00] font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-[#FFE330] transition-colors"
        >
          + Добавить команду
        </button>
      </div>

      {loading ? (
        <p className="text-white/40 text-sm">Загрузка...</p>
      ) : commands.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
          <p className="text-white/40 text-sm">Нет команд</p>
          <p className="text-white/20 text-xs mt-1">
            Нажми "+ Добавить команду" чтобы создать первую
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {commands.map((cmd) => (
            <div
              key={cmd.id}
              className="bg-[#111] border border-white/5 rounded-2xl px-5 py-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#FFE100] font-black text-sm font-mono">
                    !{cmd.name}
                  </span>
                  <span className="text-[10px] text-white/20 font-mono">
                    {cmd.cooldown}s
                  </span>
                  {!cmd.is_active && (
                    <span className="text-[10px] font-bold bg-white/5 text-white/30 px-2 py-0.5 rounded-full">
                      Отключена
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/60 truncate">{cmd.response}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(cmd)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    cmd.is_active
                      ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
                      : "bg-white/5 text-white/30 hover:bg-white/10"
                  }`}
                >
                  {cmd.is_active ? "Вкл" : "Выкл"}
                </button>
                <button
                  onClick={() => openEdit(cmd)}
                  className="px-3 py-1.5 bg-white/5 text-white/40 text-xs font-bold rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                >
                  Изменить
                </button>
                <button
                  onClick={() => handleDelete(cmd.id)}
                  className="px-3 py-1.5 bg-red-500/10 text-red-400/50 text-xs font-bold rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
