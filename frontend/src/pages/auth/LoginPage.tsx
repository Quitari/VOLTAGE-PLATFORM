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
          className="text-2xl font-black tracking-tighter text-[#FFE100] uppercase"
        >
          {settings?.streamer_name || "VOLTAGE"}
        </button>
        <button
          onClick={() => navigate("/register")}
          className="bg-[#FFE100] text-[#211C00] px-6 py-2 font-bold rounded-lg hover:bg-[#FFE330] transition-all uppercase text-sm"
        >
          РЕГИСТРАЦИЯ
        </button>
      </header>

      <main className="flex-1 pt-32 pb-20 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Левая часть — форма */}
          <section className="bg-[#111] p-8 lg:p-12 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#FFE100]" />
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">
              Войти
            </h1>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {[
                {
                  field: "login",
                  label: "Логин или Email",
                  type: "text",
                  placeholder: "username или email@example.com",
                },
                {
                  field: "password",
                  label: "Пароль",
                  type: "password",
                  placeholder: "••••••••",
                },
              ].map((item) => (
                <div key={item.field} className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    {item.label}
                  </label>
                  <input
                    type={item.type}
                    value={form[item.field as keyof typeof form]}
                    onChange={(e) =>
                      setForm({ ...form, [item.field]: e.target.value })
                    }
                    placeholder={item.placeholder}
                    required
                    className="w-full bg-[#0E0E0E] border-0 border-b-2 border-white/10 focus:border-[#FFE100] text-white py-4 placeholder:text-white/20 outline-none transition-colors"
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFE100] text-[#211C00] py-4 rounded-xl font-black uppercase tracking-tight hover:bg-[#FFE330] transition-all active:scale-[0.98] disabled:opacity-50"
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
                  className="text-[#FFE100] font-bold hover:underline"
                >
                  Зарегистрироваться
                </button>
              </p>
            </form>
          </section>

          {/* Правая часть — информация */}
          <section className="bg-[#111] p-8 lg:p-12 rounded-2xl relative overflow-hidden flex flex-col justify-center min-h-[400px]">
            <div className="absolute top-0 right-0 w-1 h-full bg-[#FFE100]" />
            <div className="text-center">
              <div className="w-24 h-24 bg-[#FFE100]/10 rounded-full flex items-center justify-center mx-auto mb-8">
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
                    <div className="w-5 h-5 rounded-full bg-[#FFE100]/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#FFE100]" />
                    </div>
                    <p className="text-sm text-white/60">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#FFE100]/5 rounded-full blur-3xl pointer-events-none" />
          </section>
        </div>
      </main>
    </div>
  );
}
