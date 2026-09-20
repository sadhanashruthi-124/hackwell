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
    <header className="h-16 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-8 shrink-0">
      <div>
        <h1 className="text-base font-semibold text-white leading-tight">{title}</h1>
        <p className="text-xs text-white/40 leading-tight mt-0.5">
          {subtitle ?? `${greeting()}, ${user?.name?.split(' ')[0] ?? 'there'}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-white/40 hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full" />
        </button>
        {showCreateEvent && (
          <button
            id="create-event-btn"
            onClick={() => navigate('/events/new')}
            className="btn-dark-primary flex items-center gap-1.5 px-4 py-2 text-sm font-semibold"
          >
            <Plus size={15} />
            Create Event
          </button>
        )}
      </div>
    </header>
  )
}
