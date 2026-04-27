import { useEffect, useRef, useState } from "react";
import { authApi } from "../../../api/auth";
import client from "../../../api/client";
import { useAuthStore } from "../../../store/auth";
import type { Role } from "../../../types";

const ALL_PERMISSIONS = [
  { codename: "giveaways.view", name: "Просмотр розыгрышей" },
  { codename: "giveaways.create", name: "Создание розыгрышей" },
  { codename: "giveaways.draw", name: "Подведение итогов" },
  { codename: "moderation.view", name: "Просмотр наказаний" },
  { codename: "moderation.punish", name: "Выдача наказаний" },
  { codename: "moderation.revoke", name: "Отмена наказаний" },
  { codename: "users.view", name: "Просмотр пользователей" },
  { codename: "prizes.manage", name: "Управление призами" },
  { codename: "settings.manage", name: "Управление настройками" },
];

const PRESET_COLORS = [
  "#9caffc",
  "#FF6B35",
  "#EF4444",
  "#F97316",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#AAAAAA",
];

export default function RolesPage() {
  const { loadUser } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Модалка создания/редактирования
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [form, setForm] = useState({
    name: "",
    codename: "",
    level: 0,
    color: "#AAAAAA",
    description: "",
    permissions: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Назначение роли (форма слева)
  const [assignSearch, setAssignSearch] = useState("");
  const [assignResults, setAssignResults] = useState<any[]>([]);
  const [assignSelectedUser, setAssignSelectedUser] = useState<any>(null);
  const [assignSelectedRole, setAssignSelectedRole] = useState("");
  const [assignExpires, setAssignExpires] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  // Снятие роли
  const [revokeId, setRevokeId] = useState<number | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Удаление роли
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      authApi.roles(),
      client.get("/auth/role-assignments/"),
      client.get("/auth/permissions/"),
    ])
      .then(([r, a, p]) => {
        setRoles(r.data);
        setAssignments(a.data);
        setPermissions(p.data.length > 0 ? p.data : ALL_PERMISSIONS);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Поиск пользователей
  useEffect(() => {
    if (!assignSearch.trim()) {
      setAssignResults([]);
      return;
    }
    const clean = assignSearch.startsWith("@")
      ? assignSearch.slice(1)
      : assignSearch;
    const t = setTimeout(() => {
      client
        .get(`/auth/list/?search=${encodeURIComponent(clean)}`)
        .then((r) => setAssignResults(r.data.slice(0, 5)))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [assignSearch]);

  const openCreate = () => {
    setForm({
      name: "",
      codename: "",
      level: 0,
      color: "#AAAAAA",
      description: "",
      permissions: [],
    });
    setFormError("");
    setModal("create");
  };

  const openEdit = (role: Role) => {
    setEditRole(role);
    setForm({
      name: role.name,
      codename: role.codename,
      level: role.level,
      color: role.color,
      description: (role as any).description || "",
      permissions: role.permissions.map((p: any) => p.codename),
    });
    setFormError("");
    setModal("edit");
  };

  const togglePerm = (codename: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(codename)
        ? f.permissions.filter((p) => p !== codename)
        : [...f.permissions, codename],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.codename.trim()) {
      setFormError("Укажи название и codename");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (modal === "create") {
        await client.post("/auth/roles/create/", form);
      } else if (modal === "edit" && editRole) {
        await client.patch(`/auth/roles/${editRole.id}/`, form);
      }
      setModal(null);
      load();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!assignSelectedUser) {
      setAssignError("Выбери пользователя");
      return;
    }
    if (!assignSelectedRole) {
      setAssignError("Выбери роль");
      return;
    }
    setAssigning(true);
    setAssignError("");
    try {
      await client.post("/auth/assign-role/", {
        user_id: assignSelectedUser.id,
        role: assignSelectedRole,
        expires_at: assignExpires || undefined,
      });
      await loadUser();
      setAssignSuccess(`Роль назначена ${assignSelectedUser.username}`);
      setAssignSelectedUser(null);
      setAssignSearch("");
      setAssignSelectedRole("");
      setAssignExpires("");
      load();
      setTimeout(() => setAssignSuccess(""), 3000);
    } catch (err: any) {
      setAssignError(err.response?.data?.error || "Ошибка");
    } finally {
      setAssigning(false);
    }
  };

  const handleRevoke = async (assignmentId: number) => {
    setRevoking(true);
    try {
      const a = assignments.find((x) => x.id === assignmentId);
      if (!a) return;
      await client.post("/auth/revoke-role/", {
        user_id: a.user_id,
        role: a.role_codename,
      });
      await loadUser();
      setRevokeId(null);
      load();
    } catch (err: any) {
      setAssignError(err.response?.data?.error || "Ошибка");
    } finally {
      setRevoking(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await client.delete(`/auth/roles/${deleteId}/delete/`);
      setDeleteId(null);
      load();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Ошибка");
    } finally {
      setDeleting(false);
    }
  };

  const systemRoles = roles.filter((r) => (r as any).is_system).length;
  const assignableRoles = roles.filter((r) => r.level < 999 && r.level > 0);

  const isAnyModalOpen = !!(modal || revokeId || deleteId);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mainContentRef.current;
    if (!el) return;
    if (isAnyModalOpen) {
      el.setAttribute("inert", "");
    } else {
      el.removeAttribute("inert");
    }
  }, [isAnyModalOpen]);

  return (
    <div className="relative">
      {/* Модалка создания/редактирования */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase">
                {modal === "create" ? "Создать роль" : "Редактировать роль"}
              </h3>
              <button
                onClick={() => setModal(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                ⚠️ {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  Название *
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Модератор"
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  Codename *
                </label>
                <input
                  value={form.codename}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, codename: e.target.value }))
                  }
                  placeholder="moderator"
                  disabled={modal === "edit" && (editRole as any)?.is_system}
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 disabled:opacity-40"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  Уровень
                </label>
                <input
                  type="number"
                  min={0}
                  max={998}
                  value={form.level}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      level: parseInt(e.target.value) || 0,
                    }))
                  }
                  disabled={modal === "edit" && (editRole as any)?.is_system}
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40 disabled:opacity-40"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                  Цвет
                </label>
                <div className="flex gap-1.5 flex-wrap items-center">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className={`w-6 h-6 rounded-lg border-2 transition-all ${form.color === c ? "border-white scale-110" : "border-transparent"}`}
                      style={{ background: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, color: e.target.value }))
                    }
                    className="w-6 h-6 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">
                Описание
              </label>
              <input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Описание роли..."
                className="w-full bg-[#1C1B1B] border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                Права доступа
              </label>
              <div className="bg-[#1C1B1B] rounded-xl p-3 space-y-1 max-h-48 overflow-y-auto">
                {permissions.map((p: any) => (
                  <label
                    key={p.codename}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(p.codename)}
                      onChange={() => togglePerm(p.codename)}
                      className="rounded accent-[#9caffc]"
                    />
                    <span className="text-xs text-white/70">
                      {p.name || p.codename}
                    </span>
                    <span className="text-[10px] text-white/30 font-mono ml-auto">
                      {p.codename}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-[#1C1B1B] rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-[10px] text-white/40 uppercase tracking-widest">
                Превью:
              </span>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: form.color + "20", color: form.color }}
              >
                {form.name || "Роль"}
              </span>
              <span className="text-[10px] text-white/30 font-mono">
                уровень {form.level}
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-3 bg-[#1C1B1B] text-white/60 font-bold rounded-xl uppercase text-xs hover:bg-[#2A2A2A] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-[#9caffc] text-[#0a0a0a] font-bold rounded-xl uppercase text-xs hover:bg-[#7b94f8] transition-colors disabled:opacity-50"
              >
                {saving
                  ? "Сохраняем..."
                  : modal === "create"
                    ? "Создать"
                    : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка подтверждения снятия роли */}
      {revokeId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-black text-white uppercase">
              Снять роль?
            </h3>
            <p className="text-white/50 text-sm">
              Пользователь потеряет все права этой роли немедленно.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRevokeId(null)}
                className="flex-1 py-3 bg-[#1C1B1B] text-white/60 font-bold rounded-xl uppercase text-xs hover:bg-[#2A2A2A] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleRevoke(revokeId)}
                disabled={revoking}
                className="flex-1 py-3 bg-red-500/20 text-red-400 font-bold rounded-xl uppercase text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {revoking ? "..." : "Снять"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка удаления роли */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-black text-white uppercase">
              Удалить роль?
            </h3>
            <p className="text-white/50 text-sm">
              Роль будет удалена. Пользователи потеряют её.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 bg-[#1C1B1B] text-white/60 font-bold rounded-xl uppercase text-xs hover:bg-[#2A2A2A] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-500/20 text-red-400 font-bold rounded-xl uppercase text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {deleting ? "..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Основной контент — заблокирован при открытой модалке */}
      <div ref={mainContentRef} className="space-y-8">
        {/* Заголовок */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
              РОЛИ И ПРАВА
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Конфигурация иерархии и системных привилегий
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#9caffc] text-[#0a0a0a] font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-[#7b94f8] transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Создать роль
          </button>
        </div>

        {/* Метрики */}
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              label: "Всего ролей",
              value: roles.length,
              icon: "verified_user",
              color: "text-[#9caffc]",
            },
            {
              label: "Назначений",
              value: assignments.length,
              icon: "sensors",
              color: "text-green-400",
            },
            {
              label: "Системных",
              value: systemRoles,
              icon: "terminal",
              color: "text-white/40",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-[#111] border border-white/5 rounded-2xl p-6 flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">
                  {item.label}
                </p>
                <p className="text-4xl font-black text-white">
                  {loading ? "..." : item.value}
                </p>
              </div>
              <span
                className={`material-symbols-outlined text-4xl ${item.color}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {item.icon}
              </span>
            </div>
          ))}
        </div>

        {/* Карточки ролей */}
        <section>
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-6">
            Действующие роли
          </p>
          {loading ? (
            <p className="text-white/40 text-sm">Загрузка...</p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {roles.map((role) => {
                const userCount = assignments.filter(
                  (a) => a.role_codename === role.codename,
                ).length;
                const isSystem = (role as any).is_system;
                return (
                  <div
                    key={role.id}
                    className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden relative hover:bg-[#141414] transition-colors"
                    style={{ borderLeft: `4px solid ${role.color}` }}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            {isSystem && (
                              <span
                                className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-widest border rounded"
                                style={{
                                  background: role.color + "15",
                                  color: role.color,
                                  borderColor: role.color + "30",
                                }}
                              >
                                Системная
                              </span>
                            )}
                            <span className="text-white/40 text-xs font-bold">
                              LVL {role.level}
                            </span>
                          </div>
                          <h4 className="text-2xl font-black text-white mb-1">
                            {role.name}
                          </h4>
                          {(role as any).description && (
                            <p className="text-white/40 text-sm max-w-sm">
                              {(role as any).description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => openEdit(role)}
                            className="bg-[#1C1B1B] text-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-[#2A2A2A] transition-colors rounded-lg"
                          >
                            Редактировать
                          </button>
                          {!isSystem && (
                            <button
                              onClick={() => setDeleteId(role.id as number)}
                              className="text-red-400/60 hover:text-red-400 text-xs font-bold uppercase tracking-widest transition-colors text-right"
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      </div>

                      {role.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {role.permissions.slice(0, 5).map((p: any) => (
                            <span
                              key={p.codename}
                              className="text-[10px] font-bold bg-white/5 text-white/30 px-2 py-0.5 rounded font-mono"
                            >
                              {p.codename}
                            </span>
                          ))}
                          {role.permissions.length > 5 && (
                            <span className="text-[10px] text-white/20 px-2 py-0.5">
                              +{role.permissions.length - 5}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-8 items-center border-t border-white/5 pt-4">
                        <div>
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                            Пользователей
                          </p>
                          <p className="text-xl font-black text-white">
                            {userCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                            Прав
                          </p>
                          <p className="text-xl font-black text-white">
                            {isSystem && role.level >= 999
                              ? "ALL"
                              : role.permissions.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Назначение ролей */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Форма назначения */}
          <div className="lg:col-span-1">
            <div
              className={`bg-[#111] border border-white/5 rounded-2xl p-6 space-y-5 overflow-visible ${revokeId ? "pointer-events-none" : ""}`}
            >
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Назначить роль
              </h3>

              {assignError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                  ⚠️ {assignError}
                </div>
              )}
              {assignSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl">
                  ✅ {assignSuccess}
                </div>
              )}

              {/* Поиск пользователя */}
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                  Поиск пользователя
                </label>
                <div className="relative" style={{ zIndex: 1 }}>
                  <input
                    value={assignSearch}
                    onChange={(e) => {
                      setAssignSearch(e.target.value);
                      setAssignSelectedUser(null);
                    }}
                    placeholder="Ник, @Telegram..."
                    autoComplete="off"
                    className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                  />
                  {assignResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1C1B1B] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                      {assignResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setAssignSelectedUser(u);
                            setAssignSearch(u.username);
                            setAssignResults([]);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2A2A2A] transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#111] flex items-center justify-center font-bold text-[#9caffc] text-xs flex-shrink-0">
                            {u.username?.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white">
                              {u.username}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {u.email && (
                                <span className="text-xs text-white/30">
                                  {u.email}
                                </span>
                              )}
                              {u.telegram_username && (
                                <span className="text-xs text-[#24A1DE]/70">
                                  @{u.telegram_username}
                                </span>
                              )}
                              {u.twitch_username && (
                                <span className="text-xs text-[#9146FF]/70">
                                  twitch: {u.twitch_username}
                                </span>
                              )}
                              {!u.email &&
                                !u.telegram_username &&
                                !u.twitch_username && (
                                  <span className="text-xs text-white/20">
                                    нет привязок
                                  </span>
                                )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {assignSelectedUser && (
                  <div className="mt-2 bg-[#1C1B1B] rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#9caffc]/10 flex items-center justify-center text-[#9caffc] font-black text-[10px]">
                      {assignSelectedUser.username?.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-white">
                      {assignSelectedUser.username}
                    </span>
                    <button
                      onClick={() => {
                        setAssignSelectedUser(null);
                        setAssignSearch("");
                      }}
                      className="ml-auto text-white/30 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        close
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Выбор роли */}
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                  Выбор роли
                </label>
                <select
                  value={assignSelectedRole}
                  onChange={(e) => setAssignSelectedRole(e.target.value)}
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                >
                  <option value="">Выбери роль...</option>
                  {assignableRoles.map((r) => (
                    <option key={r.codename} value={r.codename}>
                      {r.name} (LVL {r.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Срок действия */}
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">
                  Срок действия (необязательно)
                </label>
                <input
                  type="date"
                  value={assignExpires}
                  onChange={(e) => setAssignExpires(e.target.value)}
                  className="w-full bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#9caffc]/40"
                />
              </div>

              <button
                onClick={handleAssign}
                disabled={
                  assigning || !assignSelectedUser || !assignSelectedRole
                }
                className="w-full py-3 bg-[#9caffc] text-[#0a0a0a] font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-[#7b94f8] transition-colors disabled:opacity-40"
              >
                {assigning ? "Назначаем..." : "Назначить"}
              </button>
            </div>
          </div>

          {/* Таблица назначений */}
          <div className="lg:col-span-2">
            <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-tight">
                  Текущие назначения
                </h3>
                <span className="text-xs text-white/30">
                  {
                    assignments.filter(
                      (a) =>
                        a.role_codename !== "member" &&
                        !a.username.startsWith("tg_") &&
                        a.username !== "voltage_bot",
                    ).length
                  }{" "}
                  записей
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      {[
                        "Пользователь",
                        "Роль",
                        "Кем выдано",
                        "Дата",
                        "Истекает",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-[10px] font-bold text-white/30 uppercase tracking-widest"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {assignments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-white/30 text-sm"
                        >
                          Нет назначений
                        </td>
                      </tr>
                    ) : (
                      assignments
                        .filter(
                          (a) =>
                            a.role_codename !== "member" &&
                            !a.username.startsWith("tg_") &&
                            a.username !== "voltage_bot",
                        )
                        .map((a) => (
                          <tr
                            key={a.id}
                            className="hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-4 py-3 text-sm font-bold text-white">
                              {a.username}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase"
                                style={{
                                  background: a.role_color + "15",
                                  color: a.role_color,
                                  borderColor: a.role_color + "30",
                                }}
                              >
                                {a.role_name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-white/40">
                              {a.assigned_by}
                            </td>
                            <td className="px-4 py-3 text-xs text-white/40">
                              {new Date(a.assigned_at).toLocaleDateString(
                                "ru-RU",
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {a.expires_at ? (
                                <span
                                  className={
                                    new Date(a.expires_at) < new Date()
                                      ? "text-red-400"
                                      : "text-white/40"
                                  }
                                >
                                  {new Date(a.expires_at).toLocaleDateString(
                                    "ru-RU",
                                  )}
                                </span>
                              ) : (
                                <span className="text-white/20">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setAssignResults([]);
                                  // Снимаем фокус со всех инпутов
                                  (
                                    document.activeElement as HTMLElement
                                  )?.blur();
                                  setRevokeId(a.id);
                                }}
                                className="text-white/20 hover:text-red-400 transition-colors"
                                title="Снять роль"
                              >
                                <span className="material-symbols-outlined text-base">
                                  remove_circle
                                </span>
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
