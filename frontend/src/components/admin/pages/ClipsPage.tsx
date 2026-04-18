import { useEffect, useState } from "react";
import client from "../../../api/client";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "На модерации", color: "bg-yellow-500/15 text-yellow-400" },
  approved: { label: "Одобрен", color: "bg-green-500/15 text-green-400" },
  rejected: { label: "Отклонён", color: "bg-red-500/15 text-red-400" },
};

function extractTwitchClipId(url: string): string | null {
  try {
    const u = new URL(url);
    // https://clips.twitch.tv/CLIP_ID
    if (u.hostname === "clips.twitch.tv") {
      return u.pathname.replace("/", "");
    }
    // https://www.twitch.tv/USERNAME/clip/CLIP_ID
    const match = u.pathname.match(/\/clip\/([^/]+)/);
    if (match) return match[1];
  } catch {}
  return null;
}

function getTwitchEmbedUrl(url: string): string | null {
  const id = extractTwitchClipId(url);
  if (!id) return null;
  const parent = window.location.hostname;
  return `https://clips.twitch.tv/embed?clip=${id}&parent=${parent}&autoplay=false`;
}

export default function ClipsPage() {
  const [clips, setClips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Модалка редактирования/одобрения
  const [editClip, setEditClip] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    game: "",
    preview_url: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Модалка отклонения
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  // Модалка добавления
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    url: "",
    game: "",
    preview_url: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const load = (status = "pending") => {
    setLoading(true);
    client
      .get(`/clips/admin/?status=${status}`)
      .then((r) => setClips(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter]);

  const openEdit = (clip: any) => {
    setEditClip(clip);
    setPreviewError(false);
    setEditForm({
      title: clip.title,
      game: clip.game || "",
      preview_url: clip.preview_url || "",
    });
  };

  const autoPreview = () => {
    if (!editClip) return;
    const id = extractTwitchClipId(editClip.url);
    if (id) {
      const preview = `https://clips-media-assets2.twitch.tv/${id}-preview-480x272.jpg`;
      setEditForm((p) => ({ ...p, preview_url: preview }));
      setPreviewError(false);
    } else {
      setPreviewError(true);
    }
  };

  const handleApproveWithEdit = async () => {
    if (!editClip) return;
    setEditLoading(true);
    try {
      await client.patch(`/clips/admin/${editClip.id}/moderate/`, {
        status: "approved",
        title: editForm.title,
        game: editForm.game,
        preview_url: editForm.preview_url,
      });
      setEditClip(null);
      load(statusFilter);
    } catch {
    } finally {
      setEditLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setActionLoading(rejectId);
    try {
      await client.patch(`/clips/admin/${rejectId}/moderate/`, {
        status: "rejected",
        admin_note: rejectNote,
      });
      setRejectId(null);
      setRejectNote("");
      load(statusFilter);
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await client.delete(`/clips/admin/${id}/delete/`);
      load(statusFilter);
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdd = async () => {
    if (!addForm.title.trim() || !addForm.url.trim()) {
      setAddError("Укажи название и ссылку");
      return;
    }
    setAddLoading(true);
    setAddError("");
    try {
      // Автопревью при добавлении
      const form = { ...addForm };
      if (!form.preview_url && form.url) {
        const auto = getTwitchPreview(form.url);
        if (auto) form.preview_url = auto;
      }
      await client.post("/clips/admin/create/", form);
      setAddModal(false);
      setAddForm({ title: "", url: "", game: "", preview_url: "" });
      load(statusFilter);
    } catch (err: any) {
      setAddError(err.response?.data?.error || "Ошибка");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Модалка редактирования и одобрения */}
      {editClip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase">
                Редактировать и одобрить
              </h3>
              <button
                onClick={() => setEditClip(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Превью */}
            <div className="relative h-40 bg-[#0E0E0E] rounded-xl overflow-hidden">
              {editForm.preview_url && !previewError ? (
                <img
                  src={editForm.preview_url}
                  alt="preview"
                  className="w-full h-full object-cover"
                  onError={() => setPreviewError(true)}
                />
              ) : getTwitchEmbedUrl(editClip.url) ? (
                <iframe
                  src={getTwitchEmbedUrl(editClip.url)!}
                  className="w-full h-full"
                  allowFullScreen
                  title="Twitch clip"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-white/20 text-5xl">
                    movie
                  </span>
                </div>
              )}
              <a
                href={editClip.url}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-2 right-2 bg-black/70 text-white/60 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  open_in_new
                </span>
                Открыть клип
              </a>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  Название
                </label>
                <input
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  Игра
                </label>
                <input
                  value={editForm.game}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, game: e.target.value }))
                  }
                  placeholder="CS2, Valorant..."
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  Превью URL
                </label>
                <div className="flex gap-2">
                  <input
                    value={editForm.preview_url}
                    onChange={(e) => {
                      setEditForm((p) => ({
                        ...p,
                        preview_url: e.target.value,
                      }));
                      setPreviewError(false);
                    }}
                    placeholder="https://..."
                    className="flex-1 bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
                  />
                  <button
                    onClick={autoPreview}
                    className="px-4 py-3 bg-[#1C1B1B] border border-white/10 text-white/60 text-xs font-bold rounded-xl hover:text-[#FFE100] hover:border-[#FFE100]/30 transition-colors whitespace-nowrap flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">
                      auto_awesome
                    </span>
                    Авто
                  </button>
                </div>
                <p className="text-[10px] text-white/20 mt-1">
                  Кнопка "Авто" попробует получить превью из Twitch URL
                </p>
              </div>

              {/* Автор */}
              <div className="bg-[#1C1B1B] rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-0.5">
                    Предложил
                  </p>
                  <p className="text-sm font-bold text-white">
                    {editClip.submitted_by || "—"}
                  </p>
                </div>
                <span className="text-xs text-white/30">
                  {editClip.created_at?.slice(0, 10)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditClip(null)}
                className="flex-1 py-3 bg-[#1C1B1B] text-white/60 font-bold rounded-xl uppercase text-xs hover:bg-[#2A2A2A] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  setEditClip(null);
                  setRejectId(editClip.id);
                }}
                className="px-4 py-3 bg-red-500/15 text-red-400 font-bold rounded-xl uppercase text-xs hover:bg-red-500/25 transition-colors"
              >
                Отклонить
              </button>
              <button
                onClick={handleApproveWithEdit}
                disabled={editLoading}
                className="flex-1 py-3 bg-[#FFE100] text-[#211C00] font-bold rounded-xl uppercase text-xs hover:bg-[#FFE330] transition-colors disabled:opacity-50"
              >
                {editLoading ? "..." : "✅ Одобрить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка отклонения */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase">
                Отклонить клип
              </h3>
              <button
                onClick={() => {
                  setRejectId(null);
                  setRejectNote("");
                }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                Причина (необязательно)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Укажи причину отклонения..."
                rows={3}
                className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectId(null);
                  setRejectNote("");
                }}
                className="flex-1 py-3 bg-[#1C1B1B] text-white/60 font-bold rounded-xl uppercase text-xs hover:bg-[#2A2A2A] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleReject}
                disabled={!!actionLoading}
                className="flex-1 py-3 bg-red-500/20 text-red-400 font-bold rounded-xl uppercase text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка добавления */}
      {addModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase">
                Добавить клип
              </h3>
              <button
                onClick={() => {
                  setAddModal(false);
                  setAddError("");
                }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {addError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                ⚠️ {addError}
              </div>
            )}
            <div className="space-y-3">
              {[
                {
                  field: "title",
                  label: "Название *",
                  placeholder: "Эпичный момент",
                },
                {
                  field: "url",
                  label: "Ссылка *",
                  placeholder: "https://clips.twitch.tv/...",
                },
                {
                  field: "game",
                  label: "Игра",
                  placeholder: "CS2, Valorant...",
                },
                {
                  field: "preview_url",
                  label: "Превью URL (необязательно)",
                  placeholder: "Оставь пустым — попробуем автоматически",
                },
              ].map((item) => (
                <div key={item.field}>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                    {item.label}
                  </label>
                  <input
                    value={addForm[item.field as keyof typeof addForm]}
                    onChange={(e) =>
                      setAddForm({ ...addForm, [item.field]: e.target.value })
                    }
                    placeholder={item.placeholder}
                    className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFE100]/40"
                  />
                </div>
              ))}
              <p className="text-[10px] text-white/20">
                Если превью не указано — попробуем получить его из Twitch URL
                автоматически
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAddModal(false);
                  setAddError("");
                }}
                className="flex-1 py-3 bg-[#1C1B1B] text-white/60 font-bold rounded-xl uppercase text-xs hover:bg-[#2A2A2A] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleAdd}
                disabled={addLoading}
                className="flex-1 py-3 bg-[#FFE100] text-[#211C00] font-bold rounded-xl uppercase text-xs hover:bg-[#FFE330] transition-colors disabled:opacity-50"
              >
                {addLoading ? "Добавляем..." : "Добавить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Заголовок */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
            КЛИПЫ
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Модерация предложенных клипов
          </p>
        </div>
        <button
          onClick={() => setAddModal(true)}
          className="px-6 py-2.5 bg-[#FFE100] text-[#211C00] font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-[#FFE330] transition-colors"
        >
          + Добавить клип
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex gap-1 border-b border-white/5">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`pb-3 px-4 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${
              statusFilter === s
                ? "text-[#FFE100] border-[#FFE100]"
                : "text-white/40 border-transparent hover:text-white"
            }`}
          >
            {STATUS_LABELS[s].label}
          </button>
        ))}
      </div>

      {/* Список клипов */}
      {loading ? (
        <p className="text-white/40 text-sm">Загрузка...</p>
      ) : clips.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-white/10 text-7xl block mb-4">
            movie
          </span>
          <p className="text-white/40 text-lg font-bold uppercase">
            Клипов нет
          </p>
          {statusFilter === "pending" && (
            <p className="text-white/20 text-sm mt-2">
              Пользователи ещё не предлагали клипы
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {clips.map((clip) => (
            <div
              key={clip.id}
              className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-5"
            >
              {/* Превью */}
              <div className="w-24 h-14 rounded-xl bg-[#1C1B1B] flex-shrink-0 overflow-hidden">
                {clip.preview_url ? (
                  <img
                    src={clip.preview_url}
                    alt={clip.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white/20">
                      movie
                    </span>
                  </div>
                )}
              </div>

              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-white truncate">{clip.title}</p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase flex-shrink-0 ${STATUS_LABELS[clip.status]?.color}`}
                  >
                    {STATUS_LABELS[clip.status]?.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  {clip.game && <span>{clip.game}</span>}
                  {clip.submitted_by && (
                    <>
                      <span>·</span>
                      <span>от {clip.submitted_by}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{clip.created_at?.slice(0, 10)}</span>
                </div>
                {clip.admin_note && (
                  <p className="text-xs text-red-400/70 mt-1">
                    Причина: {clip.admin_note}
                  </p>
                )}
              </div>

              {/* Кнопки */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {clip.status === "pending" && (
                  <button
                    onClick={() => openEdit(clip)}
                    className="px-3 py-1.5 bg-[#FFE100]/15 text-[#FFE100] text-xs font-bold rounded-lg hover:bg-[#FFE100]/25 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">
                      edit
                    </span>
                    Рассмотреть
                  </button>
                )}

                <a
                  href={clip.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#1C1B1B] border border-white/10 text-white/60 text-xs font-bold rounded-lg hover:text-white transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">
                    open_in_new
                  </span>
                </a>

                <button
                  onClick={() => handleDelete(clip.id)}
                  disabled={actionLoading === clip.id}
                  className="px-3 py-1.5 bg-white/5 text-white/30 text-xs font-bold rounded-lg hover:bg-red-500/15 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    delete
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
