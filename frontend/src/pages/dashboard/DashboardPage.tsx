import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

export default function DashboardPage() {
  const { user, logout, userLevel } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-[#FFE100] uppercase tracking-tighter">
            VOLTAGE
          </h1>
          <button
            onClick={handleLogout}
            className="text-white/40 hover:text-white text-sm transition-colors"
          >
            Выйти
          </button>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 mb-4">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">
            Привет
          </p>
          <p className="text-2xl font-bold">{user?.username}</p>
          <p className="text-white/40 text-sm mt-1">
            Уровень доступа: {userLevel()}
          </p>
        </div>

        {userLevel() >= 30 && (
          <button
            onClick={() => navigate("/admin")}
            className="w-full bg-[#FFE100] text-[#211C00] font-bold py-3 rounded-xl uppercase tracking-widest text-sm hover:bg-[#FFE330] transition-colors"
          >
            ⚙️ Панель управления
          </button>
        )}
      </div>
    </div>
  );
}
