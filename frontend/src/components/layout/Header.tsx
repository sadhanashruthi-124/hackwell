import { Bell, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface HeaderProps {
  title: string
  subtitle?: string
  showCreateEvent?: boolean
}

export default function Header({ title, subtitle, showCreateEvent = false }: HeaderProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 leading-tight">{title}</h1>
        <p className="text-sm text-slate-500 leading-tight mt-0.5">
          {subtitle ?? `${greeting()}, ${user?.name?.split(' ')[0] ?? 'there'}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
        </button>
        {showCreateEvent && (
          <button
            id="create-event-btn"
            onClick={() => navigate('/events/new')}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium rounded transition-colors"
          >
            <Plus size={15} />
            Create Event
          </button>
        )}
      </div>
    </header>
  )
}
