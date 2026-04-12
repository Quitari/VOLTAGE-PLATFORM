import { Routes, Route } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import DashboardHome from '../../components/admin/pages/DashboardHome'
import UsersPage from '../../components/admin/pages/UsersPage'
import GiveawaysPage from '../../components/admin/pages/GiveawaysPage'
import ModerationPage from '../../components/admin/pages/ModerationPage'
import TicketsPage from '../../components/admin/pages/TicketsPage'
import AppealsPage from '../../components/admin/pages/AppealsPage'
import LogsPage from '../../components/admin/pages/LogsPage'
import RolesPage from '../../components/admin/pages/RolesPage'
import SettingsPage from '../../components/admin/pages/SettingsPage'
import PrizesPage from '../../components/admin/pages/PrizesPage'

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="giveaways" element={<GiveawaysPage />} />
        <Route path="moderation" element={<ModerationPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="appeals" element={<AppealsPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="prizes" element={<PrizesPage />} />
      </Routes>
    </AdminLayout>
  )
}
