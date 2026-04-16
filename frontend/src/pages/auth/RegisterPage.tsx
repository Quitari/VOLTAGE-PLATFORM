import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import client from "../../api/client";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [linkToken, setLinkToken] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Polling — проверяем привязан ли Telegram каждые 3 сек
  useEffect(() => {
    if (step !== 2) return;
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await client.get("/auth/me/");
        if (data.has_telegram) {
          clearInterval(pollRef.current!);
          navigate("/dashboard");
        }
      } catch {}
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register(form);
      const { data } = await client.post("/auth/telegram/generate-token/");
      setLinkToken(data.token);
      setStep(2);
    } catch (err: any) {
      const data = err.response?.data;
      if (typeof data === "object") {
        const first = Object.values(data)[0];
        setError(Array.isArray(first) ? (first[0] as string) : String(first));
      } else {
        setError("Ошибка регистрации");
      }
    } finally {
      setLoading(false);
    }
  };

  const botUsername = "voltage_platformbot";

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
          VOLTAGE
        </button>
        <button
          onClick={() => navigate("/login")}
          className="bg-[#FFE100] text-[#211C00] px-6 py-2 font-bold rounded-lg hover:bg-[#FFE330] transition-all uppercase text-sm"
        >
          ВОЙТИ
        </button>
      </header>

      <main className="flex-1 pt-32 pb-20 px-6 max-w-7xl mx-auto w-full">
        {/* Stepper */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center w-full max-w-md">
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-black mb-2 transition-colors"
                style={{
                  background: step >= 1 ? "#FFE100" : "#1C1B1B",
                  color: step >= 1 ? "#211C00" : "rgba(255,255,255,0.4)",
                }}
              >
                1
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${step >= 1 ? "text-[#FFE100]" : "text-white/40"}`}
              >
                Аккаунт
              </span>
            </div>
            <div
              className={`h-0.5 flex-1 mb-6 transition-colors ${step >= 2 ? "bg-[#FFE100]/40" : "bg-white/10"}`}
            />
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-black mb-2 transition-colors"
                style={{
                  background: step >= 2 ? "#FFE100" : "#1C1B1B",
                  color: step >= 2 ? "#211C00" : "rgba(255,255,255,0.4)",
                }}
              >
                2
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${step >= 2 ? "text-[#FFE100]" : "text-white/40"}`}
              >
                Telegram
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Левая часть */}
          {step === 1 ? (
            <section className="bg-[#111] p-8 lg:p-12 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#FFE100]" />
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">
                Создать аккаунт
              </h1>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {[
                  {
                    field: "username",
                    label: "Никнейм",
                    type: "text",
                    placeholder: "username",
                  },
                  {
                    field: "email",
                    label: "Email",
                    type: "email",
                    placeholder: "email@example.com",
                  },
                  {
                    field: "password",
                    label: "Пароль",
                    type: "password",
                    placeholder: "••••••••",
                  },
                  {
                    field: "password_confirm",
                    label: "Повтори пароль",
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
                      onChange={(e) => set(item.field, e.target.value)}
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
                  {loading ? "Регистрация..." : "Продолжить"}
                </button>

                <div className="relative flex items-center justify-center py-4">
                  <div className="w-full h-px bg-white/10" />
                  <span className="absolute bg-[#111] px-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    или
                  </span>
                </div>

                <p className="text-center text-sm text-white/40">
                  Уже есть аккаунт?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-[#FFE100] font-bold hover:underline"
                  >
                    Войти
                  </button>
                </p>
              </form>
            </section>
          ) : (
            <section className="bg-[#111] p-8 lg:p-12 rounded-2xl relative overflow-hidden flex flex-col justify-center min-h-[400px]">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">✅</span>
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">
                  Аккаунт создан!
                </h2>
                <p className="text-white/50 text-sm mb-8">
                  Привяжи Telegram чтобы участвовать в розыгрышах
                </p>

                <div className="bg-[#1C1B1B] rounded-2xl p-6 mb-6">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 text-center">
                    Твой код привязки
                  </p>
                  <p className="text-4xl font-black text-[#FFE100] tracking-widest font-mono text-center mb-4">
                    {linkToken}
                  </p>
                  <p className="text-xs text-white/40 text-center">
                    Отправь боту команду:
                  </p>
                  <p className="text-sm font-mono text-white text-center bg-[#0E0E0E] rounded-lg px-4 py-2 mt-2">
                    /link {linkToken}
                  </p>
                </div>

                <div className="space-y-3">
                  <a
                    href={`https://t.me/${botUsername}?start=link_${linkToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-[#24A1DE] text-white py-4 rounded-xl font-black uppercase tracking-tight hover:opacity-90 transition-all flex items-center justify-center"
                  >
                    Открыть бота
                  </a>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                  >
                    Пропустить
                  </button>
                </div>

                <p className="text-xs text-white/20 mt-6 animate-pulse">
                  Ожидаем привязку...
                </p>
              </div>
            </section>
          )}

          {/* Правая часть */}
          {step === 1 ? (
            <section className="bg-[#111] p-8 lg:p-12 rounded-2xl relative overflow-hidden flex flex-col justify-center min-h-[400px]">
              <div className="absolute top-0 right-0 w-1 h-full bg-[#24A1DE]" />
              <div className="text-center">
                <div className="w-24 h-24 bg-[#24A1DE]/10 rounded-full flex items-center justify-center mx-auto mb-8">
                  <svg
                    className="w-14 h-14 text-[#24A1DE]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.36-.49.99-.75 3.89-1.69 6.48-2.81 7.78-3.36 3.69-1.56 4.46-1.83 4.96-1.84.11 0 .35.03.5.16.13.1.17.24.18.33.02.06.03.19.02.26z" />
                  </svg>
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">
                  Привяжи Telegram
                </h2>
                <p className="text-white/50 mb-10 max-w-sm mx-auto leading-relaxed text-sm">
                  Привязка Telegram позволит мгновенно входить в аккаунт,
                  получать уведомления о стримах и участвовать в эксклюзивных
                  розыгрышах.
                </p>
              </div>
              <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#FFE100]/5 rounded-full blur-3xl pointer-events-none" />
            </section>
          ) : (
            <section className="bg-[#111] p-8 lg:p-12 rounded-2xl relative overflow-hidden flex flex-col justify-center min-h-[400px]">
              <div className="absolute top-0 right-0 w-1 h-full bg-[#24A1DE]" />
              <div className="text-center space-y-6">
                <h3 className="text-xl font-black uppercase tracking-tighter text-white/60">
                  Как привязать?
                </h3>
                {[
                  { num: "1", text: 'Нажми "Открыть бота" слева' },
                  { num: "2", text: `/link ${linkToken}` },
                  {
                    num: "3",
                    text: "Готово — сайт перенаправит автоматически!",
                  },
                ].map((item) => (
                  <div
                    key={item.num}
                    className="flex items-center gap-4 text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#FFE100]/10 flex items-center justify-center text-[#FFE100] font-black text-sm flex-shrink-0">
                      {item.num}
                    </div>
                    <p className="text-sm text-white/60 font-mono">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#24A1DE]/5 rounded-full blur-3xl pointer-events-none" />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
