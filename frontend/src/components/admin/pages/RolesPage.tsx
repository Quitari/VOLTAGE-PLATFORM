import { useEffect, useState } from "react";
import { authApi } from "../../../api/auth";
import type { Role } from "../../../types";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .roles()
      .then((res) => setRoles(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
          РОЛИ И ПРАВА
        </h1>
        <p className="text-white/40 text-sm mt-1">Ролей: {roles.length}</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-white/40 text-sm">Загрузка...</p>
        ) : (
          roles.map((role) => (
            <div
              key={role.id}
              className="bg-[#111] border border-white/5 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: role.color }}
                  />
                  <span
                    className="text-sm font-black uppercase tracking-wider"
                    style={{ color: role.color }}
                  >
                    {role.name}
                  </span>
                  <span className="text-xs text-white/40 font-mono">
                    {role.codename}
                  </span>
                </div>
                <span className="text-xs font-bold bg-white/5 text-white/40 px-3 py-1 rounded-full">
                  Уровень {role.level}
                </span>
              </div>

              {role.permissions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {role.permissions.map((p) => (
                    <span
                      key={p.codename}
                      className="text-[10px] font-bold bg-white/5 text-white/30 px-2 py-1 rounded-full font-mono"
                    >
                      {p.codename}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
