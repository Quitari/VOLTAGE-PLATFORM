import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#FFE100] tracking-tighter uppercase">
            VOLTAGE
          </h1>
          <p className="text-white/40 text-sm mt-2">Платформа для стримеров</p>
        </div>

        <div className="bg-[#111111] border border-white/5 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-6">
            Вход
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                Логин или Email
              </label>
              <input
                type="text"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40 transition-colors"
                placeholder="username или email@example.com"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                Пароль
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFE100] text-[#211C00] font-bold py-3 rounded-xl uppercase tracking-widest text-sm hover:bg-[#FFE330] transition-colors active:scale-95 disabled:opacity-50"
            >
              {loading ? "Входим..." : "Войти"}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Нет аккаунта?{" "}
            <Link to="/register" className="text-[#FFE100] hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
