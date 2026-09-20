import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  CalendarDays,
  Package,
  TrendingUp,
  Zap,
  FileText,
  Database,
  Settings,
  LogOut,
  Grid2X2,
} from 'lucide-react'

const workspaceNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/events', icon: CalendarDays, label: 'Events' },
  { to: '/resources', icon: Package, label: 'Resources' },
  { to: '/history', icon: Database, label: 'Historical Data' },
]

const intelligenceNav = [
  { to: '/predictions', icon: TrendingUp, label: 'Attendance Prediction' },
  { to: '/optimization', icon: Zap, label: 'Resource Optimization' },
]

const outputNav = [
  { to: '/reports', icon: FileText, label: 'Reports' },
]

const systemNav = [
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'OG'

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[#0a0a0a] border-r border-white/10 shrink-0 select-none">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
        <div
          className="w-7 h-7 rounded flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}
        >
          <Grid2X2 size={14} className="text-white" />
        </div>
        <div>
          <span
            className="text-[15px] font-bold tracking-tight block"
            style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            HackWell
          </span>
          {user?.institution_name && (
            <span className="text-[10px] text-white/40 truncate block max-w-[150px]">
              {user.institution_name}
            </span>
          )}
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-4 pt-4 flex flex-col gap-5 overflow-y-auto">
        {/* Workspace */}
        <div>
          <p className="px-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Workspace</p>
          <div className="space-y-0.5">
            {workspaceNav.map(({ to, icon: Icon, label }) => (
              <NavLinkItem key={to} to={to} icon={Icon} label={label} />
            ))}
          </div>
        </div>

        {/* Intelligence */}
        <div>
          <p className="px-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Intelligence</p>
          <div className="space-y-0.5">
            {intelligenceNav.map(({ to, icon: Icon, label }) => (
              <NavLinkItem key={to} to={to} icon={Icon} label={label} />
            ))}
          </div>
        </div>

        {/* Output */}
        <div>
          <p className="px-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">Output</p>
          <div className="space-y-0.5">
            {outputNav.map(({ to, icon: Icon, label }) => (
              <NavLinkItem key={to} to={to} icon={Icon} label={label} />
            ))}
          </div>
        </div>

        {/* System */}
        <div>
          <p className="px-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">System</p>
          <div className="space-y-0.5">
            {systemNav.map(({ to, icon: Icon, label }) => (
              <NavLinkItem key={to} to={to} icon={Icon} label={label} />
            ))}
          </div>
        </div>
      </nav>

      {/* User profile footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/90 truncate">{user?.name ?? 'Organizer'}</p>
            <span className="inline-block px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-medium rounded">
              Organizer
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Sign Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavLinkItem({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          isActive
            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25'
            : 'text-white/50 hover:bg-white/5 hover:text-white/80'
        }`
      }
    >
      <Icon size={15} />
      <span>{label}</span>
    </NavLink>
  )
}
