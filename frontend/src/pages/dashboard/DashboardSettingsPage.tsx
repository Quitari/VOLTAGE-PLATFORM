import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/auth";
import client from "../../api/client";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 ${
        checked ? "bg-[#FFE100]" : "bg-[#353534]"
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${
          checked ? "left-7 bg-[#211C00]" : "left-1 bg-white/40"
        }`}
      />
    </button>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "••••••••"}
          className="w-full bg-[#0E0E0E] border-b-2 border-white/10 focus:border-[#FFE100] text-white px-4 py-3 pr-12 focus:outline-none transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-xl">
            {show ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default function DashboardSettingsPage() {
  const { user, loadUser } = useAuthStore();

  const [platformName, setPlatformName] = useState("Voltage");

  useEffect(() => {
    client
      .get("/bots/settings/")
      .then((r) => {
        if (r.data.streamer_name) setPlatformName(r.data.streamer_name);
      })
      .catch(() => {});
  }, []);

  // Профиль
  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Пароль
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  // Приватность
  const [privacy, setPrivacy] = useState({
    showWins: true,
    showInFeed: true,
  });

  // Опасная зона
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const topRole = user?.roles?.length
    ? user.roles.reduce((p: any, c: any) =>
        c.role.level > p.role.level ? c : p,
      )
    : null;

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await client.patch("/auth/profile/", form);
      await loadUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      const data = err.response?.data;
      if (typeof data === "object") {
        const first = Object.values(data)[0];
        setSaveError(
          Array.isArray(first) ? (first[0] as string) : String(first),
        );
      } else {
        setSaveError("Ошибка сохранения");
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPwError("Заполни все поля");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPwError("Пароли не совпадают");
      return;
    }
    if (passwords.new.length < 8) {
      setPwError("Минимум 8 символов");
      return;
    }
    setPwSaving(true);
    setPwError("");
    try {
      await client.post("/auth/change-password/", {
        old_password: passwords.current,
        new_password: passwords.new,
      });
      setPasswords({ current: "", new: "", confirm: "" });
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: any) {
      setPwError(err.response?.data?.error || "Ошибка смены пароля");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="max-w-5xl pb-32">
      {/* Модалка удаления аккаунта */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-red-500/20 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center gap-3 text-red-400 mb-2">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              <h3 className="text-lg font-black uppercase">Удалить аккаунт</h3>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              Это действие необратимо. Все твои данные, участия в розыгрышах и
              призы будут удалены навсегда.
            </p>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                Введи свой никнейм для подтверждения
              </label>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={user?.username}
                className="w-full bg-[#1C1B1B] border border-red-500/20 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-red-500/40"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModal(false);
                  setDeleteConfirm("");
                }}
                className="flex-1 py-3 bg-[#1C1B1B] text-white/60 font-bold rounded-xl uppercase text-xs hover:bg-[#2A2A2A] transition-colors"
              >
                Отмена
              </button>
              <button
                disabled={deleteConfirm !== user?.username}
                className="flex-1 py-3 bg-red-500/20 text-red-400 font-bold rounded-xl uppercase text-xs hover:bg-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Удалить навсегда
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Заголовок */}
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
          Настройки аккаунта
        </h1>
        <p className="text-white/40 mt-2 font-medium">
          Управляй своим присутствием в системе {platformName}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Левая колонка */}
        <div className="lg:col-span-7 space-y-8">
          {/* Профиль */}
          <section className="bg-[#111] border border-white/5 rounded-2xl p-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
              {/* Аватар */}
              <div className="relative group cursor-pointer flex-shrink-0">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#FFE100] p-1 bg-[#0E0E0E] shadow-xl shadow-[#FFE100]/10">
                  <div className="w-full h-full rounded-full bg-[#1C1B1B] flex items-center justify-center text-[#FFE100] font-black text-3xl">
                    {user?.username?.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-[#FFE100]">
                    photo_camera
                  </span>
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <button className="bg-[#1C1B1B] hover:bg-[#2A2A2A] border border-white/5 text-white px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all border-b-2 border-b-white/10">
                  Изменить фото
                </button>
                <p className="text-xs text-white/30 mt-3 uppercase tracking-widest">
                  JPG, PNG или GIF. Макс 2MB.
                </p>
              </div>
            </div>

            {/* Поля */}
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#FFE100] block mb-1.5">
                  Отображаемое имя
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="w-full bg-[#0E0E0E] border-b-2 border-white/10 focus:border-[#FFE100] text-white px-4 py-3 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#FFE100] block mb-1.5">
                  Email адрес
                </label>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="email@voltage.gg"
                    className="flex-1 bg-[#0E0E0E] border-b-2 border-white/10 focus:border-[#FFE100] text-white px-4 py-3 focus:outline-none transition-colors"
                  />
                  <button className="bg-[#1C1B1B] hover:bg-[#2A2A2A] text-white/70 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border border-white/5">
                    Изменить
                  </button>
                </div>
              </div>

              {/* Язык */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#FFE100] block mb-2">
                  Язык интерфейса
                </label>
                <div className="flex bg-[#0E0E0E] border border-white/5 p-1 rounded-xl w-fit">
                  <button className="px-6 py-1.5 rounded-lg bg-[#FFE100] text-[#211C00] text-xs font-bold transition-all">
                    RU
                  </button>
                  <button className="px-6 py-1.5 rounded-lg text-white/40 text-xs font-bold hover:text-white transition-all">
                    EN
                  </button>
                </div>
              </div>
            </div>

            {/* Уведомления */}
            {saveSuccess && (
              <div className="mt-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl">
                ✅ Профиль обновлён
              </div>
            )}
            {saveError && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                ⚠️ {saveError}
              </div>
            )}
          </section>

          {/* Приватность */}
          <section className="bg-[#111] border border-white/5 rounded-2xl p-8">
            <h2 className="text-xl font-black uppercase tracking-tight text-white mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#FFE100]">
                security
              </span>
              Приватность
            </h2>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-white">
                    Публично показывать мои победы
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    Другие пользователи увидят твою статистику в профиле
                  </p>
                </div>
                <Toggle
                  checked={privacy.showWins}
                  onChange={() =>
                    setPrivacy((p) => ({ ...p, showWins: !p.showWins }))
                  }
                />
              </div>
              <div className="border-t border-white/5" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-white">
                    Никнейм в ленте победителей
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    Отображать твоё имя при выигрыше в конкурсах
                  </p>
                </div>
                <Toggle
                  checked={privacy.showInFeed}
                  onChange={() =>
                    setPrivacy((p) => ({ ...p, showInFeed: !p.showInFeed }))
                  }
                />
              </div>
            </div>
          </section>
        </div>

        {/* Правая колонка */}
        <div className="lg:col-span-5 space-y-8">
          {/* Безопасность — смена пароля */}
          <section className="bg-[#111] border border-white/5 rounded-2xl p-8 border-t-4 border-t-[#FFE100]/20">
            <h2 className="text-xl font-black uppercase tracking-tight text-white mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#FFE100]">
                lock
              </span>
              Безопасность
            </h2>
            <div className="space-y-4">
              <PasswordField
                label="Текущий пароль"
                value={passwords.current}
                onChange={(v) => setPasswords((p) => ({ ...p, current: v }))}
              />
              <PasswordField
                label="Новый пароль"
                value={passwords.new}
                onChange={(v) => setPasswords((p) => ({ ...p, new: v }))}
                placeholder="Мин. 8 символов"
              />
              <PasswordField
                label="Подтверждение пароля"
                value={passwords.confirm}
                onChange={(v) => setPasswords((p) => ({ ...p, confirm: v }))}
                placeholder="Повторите пароль"
              />

              {pwError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl">
                  ⚠️ {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-4 py-3 rounded-xl">
                  ✅ Пароль изменён
                </div>
              )}

              <button
                onClick={handlePasswordChange}
                disabled={pwSaving}
                className="w-full mt-2 bg-[#1C1B1B] hover:bg-[#2A2A2A] border border-white/5 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {pwSaving ? "Меняем..." : "Обновить пароль"}
              </button>
            </div>
          </section>

          {/* Информация об аккаунте */}
          <section className="bg-[#111] border border-white/5 rounded-2xl p-6">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
              Информация
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Роль</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={
                    topRole
                      ? {
                          background: topRole.role.color + "20",
                          color: topRole.role.color,
                        }
                      : { color: "rgba(255,255,255,0.4)" }
                  }
                >
                  {topRole?.role.name || "Участник"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Регистрация</span>
                <span className="text-white">
                  {user?.created_at?.slice(0, 10)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">ID</span>
                <span className="text-white/50 font-mono text-xs">
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
          </section>

          {/* Опасная зона */}
          <section className="p-8 rounded-2xl border-2 border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              <h2 className="text-sm font-black uppercase tracking-widest">
                Опасная зона
              </h2>
            </div>
            <p className="text-xs text-white/40 mb-6 leading-relaxed">
              Удаление аккаунта необратимо. Все твои достижения и данные будут
              безвозвратно удалены из системы.
            </p>
            <button
              onClick={() => setDeleteModal(true)}
              className="w-full border-2 border-red-500/40 hover:bg-red-500 hover:text-white text-red-400 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300"
            >
              Удалить аккаунт
            </button>
          </section>
        </div>
      </div>

      {/* Фиксированная нижняя панель */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0A0A0A]/90 backdrop-blur-md z-40 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#FFE100] hover:bg-[#FFE330] text-[#211C00] font-black py-4 rounded-xl uppercase tracking-widest text-sm transition-all shadow-xl shadow-[#FFE100]/10 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : "Сохранить все изменения"}
          </button>
        </div>
      </div>
    </div>
  );
}
