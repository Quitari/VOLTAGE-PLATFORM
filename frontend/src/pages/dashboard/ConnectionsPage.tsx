import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/auth";
import client from "../../api/client";

export default function ConnectionsPage() {
  const { user, loadUser } = useAuthStore();
  const [steamUrl, setSteamUrl] = useState("");
  const [twitchUsername, setTwitchUsername] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Модалка подтверждения отвязки
  const [confirmModal, setConfirmModal] = useState<{
    platform: string;
    label: string;
  } | null>(null);

  // Telegram link token
  const [telegramToken, setTelegramToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);

  // Смена пароля
  const [pwForm, setPwForm] = useState({
    old_password: "",
    new_password: "",
    confirm: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    setSteamUrl(user?.steam_trade_url || "");
    setTwitchUsername(user?.twitch_username || "");
  }, [user]);

  useEffect(() => {
    if (!telegramToken) {
      if (pollRef.current) clearInterval(pollRef.current);
      setPolling(false);
      return;
    }
    setPolling(true);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await client.get("/auth/me/");
        if (data.has_telegram) {
          clearInterval(pollRef.current!);
          setPolling(false);
          setTelegramToken(null);
          await loadUser();
          showSuccess("Telegram успешно привязан!");
        }
      } catch {}
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [telegramToken]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };
  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  const saveSteam = async () => {
    setSaving("steam");
    try {
      await client.patch("/auth/profile/", { steam_trade_url: steamUrl });
      await loadUser();
      showSuccess("Steam Trade URL сохранён");
    } catch (err: any) {
      showError(err.response?.data?.error || "Ошибка сохранения");
    } finally {
      setSaving(null);
    }
  };

  const saveTwitch = async () => {
    setSaving("twitch");
    try {
      await client.patch("/auth/profile/", { twitch_username: twitchUsername });
      await loadUser();
      showSuccess("Twitch сохранён");
    } catch (err: any) {
      showError(err.response?.data?.error || "Ошибка сохранения");
    } finally {
      setSaving(null);
    }
  };

  const doUnlink = async (platform: string) => {
    setSaving("unlink-" + platform);
    setConfirmModal(null);
    try {
      await client.post("/auth/unlink/", { platform });
      await loadUser();
      if (platform === "twitch") setTwitchUsername("");
      if (platform === "steam") setSteamUrl("");
      showSuccess(
        `${platform.charAt(0).toUpperCase() + platform.slice(1)} отвязан`,
      );
    } catch {
      showError("Ошибка отвязки");
    } finally {
      setSaving(null);
    }
  };

  const getTelegramToken = async () => {
    setLoadingToken(true);
    try {
      const { data } = await client.post("/auth/telegram/generate-token/");
      setTelegramToken(data.token);
    } catch {
      showError("Ошибка получения кода");
    } finally {
      setLoadingToken(false);
    }
  };

  const changePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError("Пароли не совпадают");
      return;
    }
    if (pwForm.new_password.length < 8) {
      setPwError("Минимум 8 символов");
      return;
    }
    setPwSaving(true);
    setPwError("");
    try {
      await client.post("/auth/change-password/", {
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      });
      setPwSuccess(true);
      setPwForm({ old_password: "", new_password: "", confirm: "" });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: any) {
      setPwError(err.response?.data?.error || "Ошибка смены пароля");
    } finally {
      setPwSaving(false);
    }
  };

  const BOT_USERNAME = "voltage_platformbot";

  return (
    <div className="space-y-10">
      {/* Модалка подтверждения отвязки */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-sm space-y-5">
            <h2 className="text-xl font-black uppercase tracking-tight">
              Отвязать {confirmModal.label}?
            </h2>
            <p className="text-white/50 text-sm">
              {confirmModal.platform === "telegram"
                ? "Ты потеряешь возможность участвовать через Telegram бота и получать уведомления."
                : confirmModal.platform === "twitch"
                  ? "Ты не сможешь участвовать в розыгрышах через чат стрима."
                  : "Ты не сможешь получать скины автоматически."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 bg-[#1C1B1B] border border-white/10 text-white text-sm font-bold rounded-xl hover:bg-[#2A2A2A] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => doUnlink(confirmModal.platform)}
                className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold rounded-xl hover:bg-red-500/30 transition-colors"
              >
                Отвязать
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
          Привязанные <span className="text-[#FFE100]">аккаунты</span>
        </h1>
        <p className="text-white/40 text-sm mt-1 max-w-2xl">
          Управляйте подключениями социальных сетей и игровых платформ для
          участия в розыгрышах.
        </p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {/* Карточки */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Telegram */}
        <div className="bg-[#111] rounded-2xl p-8 flex flex-col justify-between hover:bg-[#1C1B1B] transition-colors">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-[#24A1DE]/20 flex items-center justify-center rounded-xl text-[#24A1DE]">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-.99.53-1.41.52-.46-.01-1.34-.26-1.99-.47-.8-.26-1.44-.4-1.39-.85.03-.24.36-.48.99-.74 3.86-1.68 6.44-2.78 7.74-3.31 3.67-1.48 4.44-1.74 4.94-1.75.11 0 .35.03.5.15.13.11.17.26.18.37z" />
                </svg>
              </div>
              {user?.has_telegram ? (
                <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-lg uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Привязан
                </span>
              ) : (
                <span className="bg-white/5 text-white/40 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">
                  Не привязан
                </span>
              )}
            </div>
            <h3 className="font-black text-xl text-white uppercase tracking-tight mb-1">
              Telegram
            </h3>
            {user?.has_telegram ? (
              <p className="text-white/40 text-sm mb-6">
                ID: {user.telegram_id}
                {user.telegram_username && (
                  <span className="text-[#24A1DE] ml-2">
                    @{user.telegram_username}
                  </span>
                )}
              </p>
            ) : (
              <div className="mb-4">
                {telegramToken ? (
                  <div className="space-y-3">
                    <p className="text-white/40 text-xs">
                      Отправь команду боту:
                    </p>
                    <div className="bg-[#0E0E0E] rounded-xl px-4 py-3 font-mono text-sm text-[#FFE100]">
                      /link {telegramToken}
                    </div>
                    <a
                      href={`https://t.me/${BOT_USERNAME}?start=link_${telegramToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full text-center bg-[#24A1DE] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                      Открыть бота
                    </a>
                    <p className="text-[10px] text-white/20 text-center flex items-center justify-center gap-1">
                      {polling && (
                        <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse inline-block" />
                      )}
                      Ожидаем привязку...
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={getTelegramToken}
                    disabled={loadingToken}
                    className="w-full bg-[#24A1DE] text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loadingToken ? "Получаем код..." : "Привязать Telegram"}
                  </button>
                )}
              </div>
            )}
          </div>
          {user?.has_telegram && (
            <button
              onClick={() =>
                setConfirmModal({ platform: "telegram", label: "Telegram" })
              }
              disabled={saving === "unlink-telegram"}
              className="w-fit text-xs font-bold text-white/30 hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">
                link_off
              </span>
              Отвязать
            </button>
          )}
        </div>

        {/* Twitch */}
        <div className="bg-[#111] rounded-2xl p-8 flex flex-col justify-between hover:bg-[#1C1B1B] transition-colors">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-[#9146FF]/20 flex items-center justify-center rounded-xl text-[#9146FF]">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                </svg>
              </div>
              {user?.has_twitch ? (
                <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-lg uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Привязан
                </span>
              ) : (
                <span className="bg-white/5 text-white/40 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">
                  Не привязан
                </span>
              )}
            </div>
            <h3 className="font-black text-xl text-white uppercase tracking-tight mb-1">
              Twitch
            </h3>
            <p className="text-white/40 text-sm mb-6">
              {user?.twitch_username || "Для участия через чат стрима"}
            </p>
          </div>
          {user?.has_twitch ? (
            <button
              onClick={() =>
                setConfirmModal({ platform: "twitch", label: "Twitch" })
              }
              disabled={saving === "unlink-twitch"}
              className="w-fit text-xs font-bold text-white/30 hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">
                link_off
              </span>
              Отвязать
            </button>
          ) : (
            <div className="space-y-2">
              <input
                value={twitchUsername}
                onChange={(e) => setTwitchUsername(e.target.value)}
                placeholder="Твой никнейм на Twitch"
                className="w-full bg-[#1C1B1B] border border-white/10 text-white text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
              />
              <button
                onClick={saveTwitch}
                disabled={saving === "twitch"}
                className="w-full bg-[#FFE100] text-[#211C00] py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#FFE330] transition-colors disabled:opacity-50"
              >
                {saving === "twitch" ? "Сохраняем..." : "Привязать Twitch"}
              </button>
            </div>
          )}
        </div>

        {/* Steam */}
        <div className="bg-[#111] rounded-2xl p-8 flex flex-col justify-between hover:bg-[#1C1B1B] transition-colors">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-white/5 flex items-center justify-center rounded-xl text-white/30 border border-white/10">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V16h-2v-2h2v-1.5C10 10.57 11.57 9 13.5 9H16v2h-2c-.55 0-1 .45-1 1v1h3l-.5 2H13v5.95C18.05 18.45 22 15.1 22 12c0-5.52-4.48-10-10-10z" />
                </svg>
              </div>
              {user?.has_steam ? (
                <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-lg uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Привязан
                </span>
              ) : (
                <span className="bg-white/5 text-white/40 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">
                  Не привязан
                </span>
              )}
            </div>
            <h3 className="font-black text-xl text-white uppercase tracking-tight mb-1">
              Steam
            </h3>
            <p className="text-white/40 text-xs mb-6">
              Нужна трейд-ссылка для получения скинов
            </p>
          </div>
          {user?.has_steam ? (
            <button
              onClick={() =>
                setConfirmModal({ platform: "steam", label: "Steam" })
              }
              disabled={saving === "unlink-steam"}
              className="w-fit text-xs font-bold text-white/30 hover:text-red-400 transition-colors uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">
                link_off
              </span>
              Отвязать
            </button>
          ) : (
            <button
              onClick={() => document.getElementById("steam-input")?.focus()}
              className="w-full bg-[#FFE100] text-[#211C00] py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-[#FFE330] transition-all active:scale-95"
            >
              Привязать Steam
            </button>
          )}
        </div>
      </div>

      {/* Steam Trade URL */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-[#FFE100]">
            swap_horiz
          </span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            Steam трейд-ссылка
          </h2>
        </div>
        <div className="flex gap-4 max-w-3xl">
          <input
            id="steam-input"
            value={steamUrl}
            onChange={(e) => setSteamUrl(e.target.value)}
            placeholder="https://steamcommunity.com/tradeoffer/new/?partner=...&token=..."
            className="flex-1 bg-[#1C1B1B] border-0 border-b-2 border-white/10 focus:border-[#FFE100] text-white py-4 px-0 text-sm outline-none transition-colors"
          />
          <button
            onClick={saveSteam}
            disabled={saving === "steam"}
            className="bg-[#FFE100] text-[#211C00] px-8 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-[#FFE330] transition-all active:scale-95 disabled:opacity-50"
          >
            {saving === "steam" ? "..." : "Сохранить"}
          </button>
        </div>
        <p className="mt-4 text-sm text-white/40">
          Трейд-ссылка необходима для автоматической отправки выигранных
          предметов.{" "}
          <a
            href="https://steamcommunity.com/my/tradeoffers/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-[#FFE100] hover:underline ml-1"
          >
            Где найти мою ссылку?
          </a>
        </p>
      </div>

      {/* Безопасность */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="material-symbols-outlined text-[#FFE100]">
            security
          </span>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            Безопасность
          </h2>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-6 border-b border-white/5">
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                Email адрес
              </p>
              <p className="text-lg text-white">{user?.email || "Не указан"}</p>
            </div>
          </div>
          <div className="py-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">
              Сменить пароль
            </p>
            {pwSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl mb-4">
                ✅ Пароль изменён
              </div>
            )}
            {pwError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
                ⚠️ {pwError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl">
              {[
                { field: "old_password", placeholder: "Текущий пароль" },
                { field: "new_password", placeholder: "Новый пароль" },
                { field: "confirm", placeholder: "Повтори пароль" },
              ].map((item) => (
                <input
                  key={item.field}
                  type="password"
                  value={pwForm[item.field as keyof typeof pwForm]}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, [item.field]: e.target.value })
                  }
                  placeholder={item.placeholder}
                  className="bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
                />
              ))}
            </div>
            <button
              onClick={changePassword}
              disabled={pwSaving}
              className="mt-3 px-6 py-2 border-2 border-white/20 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors rounded-xl disabled:opacity-50"
            >
              {pwSaving ? "Сохраняем..." : "Сменить пароль"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
