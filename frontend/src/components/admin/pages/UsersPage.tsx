import { useEffect, useState } from 'react'
import { authApi } from '../../../api/auth'
import type { User } from '../../../types'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = (s = '') => {
    setLoading(true)
    authApi.userList({ search: s })
      .then(res => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load(search)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
            ПОЛЬЗОВАТЕЛИ
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Всего: {users.length}
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по нику..."
            className="bg-[#1C1B1B] border border-white/5 text-white text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#FFE100]/40 w-64"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#FFE100] text-[#211C00] font-bold text-xs rounded-xl uppercase tracking-widest"
          >
            Найти
          </button>
        </form>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#1C1B1B]">
              {['Пользователь', 'Роль', 'Статус', 'Telegram', 'Twitch', 'Steam', 'Дата'].map(h => (
                <th key={h} className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-white/40 text-sm">
                  Загрузка...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-white/40 text-sm">
                  Пользователи не найдены
                </td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1C1B1B] flex items-center justify-center text-[#FFE100] font-bold text-xs flex-shrink-0">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{user.username}</p>
                      <p className="text-xs text-white/40">{user.email || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.roles?.[0] ? (
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-full"
                      style={{
                        background: user.roles[0].role.color + '20',
                        color: user.roles[0].role.color
                      }}
                    >
                      {user.roles[0].role.name}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    user.status === 'active'
                      ? 'bg-green-500/15 text-green-400'
                      : user.status === 'banned'
                      ? 'bg-red-500/15 text-red-400'
                      : 'bg-white/10 text-white/40'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-white/60">
                  {user.telegram_username ? `@${user.telegram_username}` : '—'}
                </td>
                <td className="px-6 py-4 text-sm text-white/60">
                  {user.twitch_username || '—'}
                </td>
                <td className="px-6 py-4">
                  {user.has_steam
                    ? <span className="text-green-400 text-xs">✓</span>
                    : <span className="text-white/20 text-xs">—</span>
                  }
                </td>
                <td className="px-6 py-4 text-xs text-white/40">
                  {user.created_at.slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
