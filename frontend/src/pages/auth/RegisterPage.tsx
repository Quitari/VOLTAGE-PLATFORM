import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const mapped: Record<string, string> = {};
        for (const [key, val] of Object.entries(data)) {
          mapped[key] = Array.isArray(val) ? (val[0] as string) : String(val);
        }
        setErrors(mapped);
      }
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "username" as const,
      label: "Никнейм",
      type: "text",
      placeholder: "coolstreamer",
    },
    {
      name: "email" as const,
      label: "Email",
      type: "email",
      placeholder: "you@example.com",
    },
    {
      name: "password" as const,
      label: "Пароль",
      type: "password",
      placeholder: "••••••••",
    },
    {
      name: "password_confirm" as const,
      label: "Повтори пароль",
      type: "password",
      placeholder: "••••••••",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#FFE100] tracking-tighter uppercase">
            VOLTAGE
          </h1>
          <p className="text-white/40 text-sm mt-2">Создай аккаунт</p>
        </div>

        <div className="bg-[#111111] border border-white/5 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-6">
            Регистрация
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[name]}
                  onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                  className={`w-full bg-[#1C1B1B] border text-white px-4 py-3 rounded-xl focus:outline-none transition-colors ${
                    errors[name]
                      ? "border-red-500/50"
                      : "border-white/5 focus:border-[#FFE100]/40"
                  }`}
                  placeholder={placeholder}
                  required
                />
                {errors[name] && (
                  <p className="text-red-400 text-xs mt-1">{errors[name]}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFE100] text-[#211C00] font-bold py-3 rounded-xl uppercase tracking-widest text-sm hover:bg-[#FFE330] transition-colors active:scale-95 disabled:opacity-50"
            >
              {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="text-[#FFE100] hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
