import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { giveawaysApi } from "../../../api/giveaways";
import client from "../../../api/client";

interface GiveawayForm {
  title: string;
  description: string;
  prize_type: "skin" | "other";
  skin_name: string;
  skin_max_price: string;
  skin_image_url: string;
  platform: "telegram" | "twitch" | "both";
  require_telegram: boolean;
  require_twitch_stream: boolean;
  twitch_keyword: string;
  draw_manually: boolean;
  ends_at: string;
}

const INITIAL: GiveawayForm = {
  title: "",
  description: "",
  prize_type: "skin",
  skin_name: "",
  skin_max_price: "",
  skin_image_url: "",
  platform: "telegram",
  require_telegram: true,
  require_twitch_stream: false,
  twitch_keyword: "",
  draw_manually: true,
  ends_at: "",
};

export default function CreateGiveawayPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<GiveawayForm>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  const set = (field: keyof GiveawayForm, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Файл не должен превышать 5 MB");
      return;
    }
    setUploadingImage(true);
    setImageError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await client.post("/giveaways/upload-image/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const base =
        import.meta.env.VITE_API_URL?.replace("/api", "") ||
        "http://localhost:8000";
      const fullUrl = `${base}${data.url}`;
      set("skin_image_url", fullUrl);
      setImagePreview(fullUrl);
    } catch (err: any) {
      setImageError(err.response?.data?.error || "Ошибка загрузки");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (activate: boolean) => {
    if (!form.title.trim()) {
      setError("Введи название приза");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        title: form.title,
        description: form.description,
        prize_type: form.prize_type,
        platform: form.platform,
        require_telegram: form.require_telegram,
        require_twitch_stream: form.require_twitch_stream,
        twitch_keyword: form.twitch_keyword,
        draw_manually: form.draw_manually,
      };
      if (form.prize_type === "skin" && form.skin_name)
        payload.skin_name = form.skin_name;
      if (form.prize_type === "skin" && form.skin_max_price)
        payload.skin_max_price = parseFloat(form.skin_max_price);
      if (form.skin_image_url) payload.skin_image_url = form.skin_image_url;
      if (form.ends_at) payload.ends_at = new Date(form.ends_at).toISOString();

      const res = await giveawaysApi.create(payload);
      const id = res.data.id;
      if (activate) await giveawaysApi.activate(id);
      navigate("/admin/giveaways");
    } catch (err: any) {
      const data = err.response?.data;
      if (typeof data === "object") {
        const first = Object.values(data)[0];
        setError(Array.isArray(first) ? (first[0] as string) : String(first));
      } else {
        setError("Ошибка создания");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/giveaways")}
          className="text-white/40 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
          НОВЫЙ РОЗЫГРЫШ
        </h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {/* Основное */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
          Основное
        </h2>

        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
            Название приза *
          </label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="AWP Азимов FT или Gift Card $50"
            className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 transition-colors"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
            Описание
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Дополнительное описание розыгрыша..."
            rows={3}
            className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 transition-colors resize-none"
          />
        </div>

        {/* Тип приза */}
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
            Тип приза
          </label>
          <div className="flex gap-2">
            {[
              { value: "skin", label: "🔫 Скин CS2" },
              { value: "other", label: "🎁 Другое" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => set("prize_type", opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  form.prize_type === opt.value
                    ? "bg-[#9caffc] text-[#0a0a0a]"
                    : "bg-[#1C1B1B] text-white/60 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Поля для скина */}
        {form.prize_type === "skin" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  Название скина
                </label>
                <input
                  value={form.skin_name}
                  onChange={(e) => set("skin_name", e.target.value)}
                  placeholder="AWP | Азимов"
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  Макс. цена (₽)
                </label>
                <input
                  type="number"
                  value={form.skin_max_price}
                  onChange={(e) => set("skin_max_price", e.target.value)}
                  placeholder="3000"
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 transition-colors"
                />
              </div>
            </div>

            {/* Фото приза */}
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                Фото приза
              </label>

              {imagePreview && (
                <div className="mb-3 flex items-center gap-3">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-20 h-20 rounded-xl object-cover border border-white/10"
                  />
                  <button
                    onClick={() => {
                      set("skin_image_url", "");
                      setImagePreview("");
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Удалить
                  </button>
                </div>
              )}

              {imageError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-xl mb-3">
                  ⚠️ {imageError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block mb-1.5">
                    Вариант 1 — URL
                  </label>
                  <input
                    value={imagePreview ? "" : form.skin_image_url}
                    onChange={(e) => {
                      if (imagePreview) return;
                      set("skin_image_url", e.target.value);
                    }}
                    placeholder="https://example.com/skin.png"
                    disabled={!!imagePreview}
                    className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 disabled:opacity-40"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    или
                  </span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block mb-1.5">
                    Вариант 2 — Файл (JPG, PNG, WEBP до 5 MB)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = "";
                    }}
                    className="w-full bg-[#1C1B1B] border border-white/5 text-white/60 px-4 py-3 rounded-xl file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#9caffc] file:text-[#FFFFFF] file:font-bold file:text-xs file:uppercase cursor-pointer"
                  />
                  {uploadingImage && (
                    <p className="text-xs text-white/40 mt-1 animate-pulse">
                      Загружаем...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Фото для других призов */}
        {form.prize_type === "other" && (
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
              Фото приза
            </label>

            {imagePreview && (
              <div className="mb-3 flex items-center gap-3">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-20 h-20 rounded-xl object-cover border border-white/10"
                />
                <button
                  onClick={() => {
                    set("skin_image_url", "");
                    setImagePreview("");
                  }}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Удалить
                </button>
              </div>
            )}

            {imageError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-xl mb-3">
                ⚠️ {imageError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block mb-1.5">
                  Вариант 1 — URL
                </label>
                <input
                  value={imagePreview ? "" : form.skin_image_url}
                  onChange={(e) => {
                    if (imagePreview) return;
                    set("skin_image_url", e.target.value);
                  }}
                  placeholder="https://example.com/prize.png"
                  disabled={!!imagePreview}
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 disabled:opacity-40"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  или
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block mb-1.5">
                  Вариант 2 — Файл (JPG, PNG, WEBP до 5 MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                    e.target.value = "";
                  }}
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white/60 px-4 py-3 rounded-xl file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#9caffc] file:text-[#FFFFFF] file:font-bold file:text-xs file:uppercase cursor-pointer"
                />
                {uploadingImage && (
                  <p className="text-xs text-white/40 mt-1 animate-pulse">
                    Загружаем...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Платформа */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
          Платформа
        </h2>

        <div className="flex gap-2">
          {[
            { value: "telegram", label: "📱 Telegram" },
            { value: "twitch", label: "📺 Twitch" },
            { value: "both", label: "🌐 Оба" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => set("platform", opt.value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                form.platform === opt.value
                  ? "bg-[#9caffc] text-[#0a0a0a]"
                  : "bg-[#1C1B1B] text-white/60 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {[
            { field: "require_telegram", label: "Нажать кнопку в Telegram" },
            { field: "require_twitch_stream", label: "Быть на стриме Twitch" },
          ].map((item) => (
            <label
              key={item.field}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div
                onClick={() =>
                  set(
                    item.field as keyof GiveawayForm,
                    !form[item.field as keyof GiveawayForm],
                  )
                }
                className={`w-5 h-5 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
                  form[item.field as keyof GiveawayForm]
                    ? "bg-[#9caffc]"
                    : "bg-[#1C1B1B] border border-white/10"
                }`}
              >
                {form[item.field as keyof GiveawayForm] && (
                  <span className="text-[#FFFFFF] text-xs font-black">✓</span>
                )}
              </div>
              <span className="text-sm text-white/60">{item.label}</span>
            </label>
          ))}
        </div>

        {(form.platform === "twitch" || form.platform === "both") && (
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
              Ключевое слово в чат Twitch
            </label>
            <input
              value={form.twitch_keyword}
              onChange={(e) => set("twitch_keyword", e.target.value)}
              placeholder="+розыгрыш"
              className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Настройки */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
          Настройки
        </h2>

        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
            Дата окончания (необязательно)
          </label>
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => set("ends_at", e.target.value)}
            className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 transition-colors"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => set("draw_manually", !form.draw_manually)}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors flex-shrink-0 ${
              form.draw_manually
                ? "bg-[#9caffc]"
                : "bg-[#1C1B1B] border border-white/10"
            }`}
          >
            {form.draw_manually && (
              <span className="text-[#FFFFFF] text-xs font-black">✓</span>
            )}
          </div>
          <div>
            <p className="text-sm text-white/60">Подвести итоги вручную</p>
            <p className="text-xs text-white/30">
              Победитель выбирается только по команде
            </p>
          </div>
        </label>
      </div>

      {/* Кнопки */}
      <div className="flex gap-3">
        <button
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="flex-1 py-3 bg-[#1C1B1B] border border-white/10 text-white font-bold rounded-xl uppercase tracking-widest text-sm hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
        >
          {loading ? "Сохраняем..." : "Сохранить черновик"}
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="flex-1 py-3 bg-[#9caffc] text-[#0a0a0a] font-bold rounded-xl uppercase tracking-widest text-sm hover:bg-[#7b94f8] transition-colors disabled:opacity-50"
        >
          {loading ? "Запускаем..." : "🚀 Создать и запустить"}
        </button>
      </div>
    </div>
  );
}
