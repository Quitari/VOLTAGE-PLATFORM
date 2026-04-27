import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import client from "../../api/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    document.title = "Войти — VOLTAGE";
    client
      .get("/bots/settings/")
      .then((r) => setSettings(r.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.login, form.password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.non_field_errors?.[0] ||
          err.response?.data?.detail ||
          "Ошибка входа",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-white flex flex-col"
      style={{
        background:
          "radial-gradient(circle at 20% 30%, rgba(255,225,0,0.05) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(19,255,67,0.03) 0%, transparent 40%), #0A0A0A",
      }}
    >
      <header className="fixed top-0 w-full z-50 bg-[#0A0A0A]/70 backdrop-blur-xl flex justify-between items-center px-8 h-20">
        <button
          onClick={() => navigate("/")}
          className="text-2xl font-black tracking-tighter text-[#0000CD] uppercase"
        >
          {settings?.streamer_name || "VOLTAGE"}
        </button>
        <button
          onClick={() => navigate("/register")}
          className="bg-[#0000CD] text-[#FFFFFF] px-6 py-2 font-bold rounded-lg hover:bg-[#1A1AE8] transition-all uppercase text-sm"
        >
          РЕГИСТРАЦИЯ
        </button>
      </header>

      <main className="flex-1 pt-32 pb-20 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Левая часть — форма */}
          <section className="bg-[#111] p-8 lg:p-12 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#0000CD]" />
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">
              Войти
            </h1>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Логин */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Логин или Email
                </label>
                <input
                  type="text"
                  value={form.login}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                  placeholder="username или email@example.com"
                  required
                  className="w-full bg-[#0E0E0E] border-0 border-b-2 border-white/10 focus:border-[#0000CD] text-white py-4 placeholder:text-white/20 outline-none transition-colors"
                />
              </div>

              {/* Пароль */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#0E0E0E] border-0 border-b-2 border-white/10 focus:border-[#0000CD] text-white py-4 pr-12 placeholder:text-white/20 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0000CD] text-[#FFFFFF] py-4 rounded-xl font-black uppercase tracking-tight hover:bg-[#1A1AE8] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Входим..." : "Войти"}
              </button>

              <div className="relative flex items-center justify-center py-4">
                <div className="w-full h-px bg-white/10" />
                <span className="absolute bg-[#111] px-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                  или
                </span>
              </div>

              <p className="text-center text-sm text-white/40">
                Нет аккаунта?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-[#0000CD] font-bold hover:underline"
                >
                  Зарегистрироваться
                </button>
              </p>
            </form>
          </section>

          {/* Правая часть — информация */}
          <section className="bg-[#111] p-8 lg:p-12 rounded-2xl relative overflow-hidden flex flex-col justify-center min-h-[400px]">
            <div className="absolute top-0 right-0 w-1 h-full bg-[#0000CD]" />
            <div className="text-center">
              <div className="w-24 h-24 bg-[#0000CD]/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-5xl">⚡</span>
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">
                {settings?.streamer_name || "VOLTAGE"}
              </h2>
              <p className="text-white/50 mb-10 max-w-sm mx-auto leading-relaxed text-sm">
                {settings?.streamer_description ||
                  "Платформа для розыгрышей скинов CS2. Участвуй в стримах, выигрывай призы и следи за любимым стримером."}
              </p>
              <div className="space-y-3 text-left max-w-xs mx-auto">
                {(settings?.streamer_features?.length > 0
                  ? settings.streamer_features
                  : [
                      "Розыгрыши каждый стрим",
                      "Участие через Telegram и Twitch",
                      "Мгновенные уведомления о победе",
                    ]
                ).map((text: string) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#0000CD]/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#0000CD]" />
                    </div>
                    <p className="text-sm text-white/60">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#0000CD]/5 rounded-full blur-3xl pointer-events-none" />
          </section>
        </div>
      </main>
    </div>
  );
}
