import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  CalendarDays,
  Package,
  TrendingUp,
  Zap,
  FileText,
  History,
  Settings,
  LogOut,
  Grid2X2,
} from 'lucide-react'

const primaryNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/events', icon: CalendarDays, label: 'Events' },
  { to: '/resources', icon: Package, label: 'Resources' },
  { to: '/predictions', icon: TrendingUp, label: 'Predictions' },
  { to: '/optimization', icon: Zap, label: 'Optimization' },
  { to: '/reports', icon: FileText, label: 'Reports' },
]

const secondaryNav = [
  { to: '/history', icon: History, label: 'Event History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U'

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-white border-r border-slate-200 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-200">
        <div className="w-7 h-7 bg-blue-900 rounded flex items-center justify-center">
          <Grid2X2 size={14} className="text-white" />
        </div>
        <span className="text-[15px] font-semibold text-blue-900 tracking-tight">HackWell</span>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 px-3 pt-4 flex flex-col gap-0.5">
        {primaryNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-800 border-l-[3px] border-blue-800 rounded-l-none -ml-3 pl-[calc(0.75rem-1px)]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {/* Divider */}
        <div className="my-3 border-t border-slate-200" />

        {secondaryNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-800 border-l-[3px] border-blue-800 rounded-l-none -ml-3 pl-[calc(0.75rem-1px)]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name ?? 'User'}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role ?? 'organizer'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
