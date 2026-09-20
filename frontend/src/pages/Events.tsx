import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Eye, Zap, Search, Plus, Calendar } from 'lucide-react'
import Header from '../components/layout/Header'
import { eventsAPI } from '../services/api'

interface Event {
  id: number
  name: string
  event_type: string
  date: string
  duration_hours: number
  registrations: number
  expected_participants?: number
  status: string
}

const STATUS_STYLES: Record<string, string> = {
  planned:   'bg-blue-500/15 text-blue-300 border border-blue-500/25',
  draft:     'bg-white/5 text-white/50 border border-white/10',
  confirmed: 'bg-green-500/15 text-green-300 border border-green-500/25',
  conflict:  'bg-red-500/15 text-red-300 border border-red-500/25',
  completed: 'bg-violet-500/15 text-violet-300 border border-violet-500/25',
}

export default function Events() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [filtered, setFiltered] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await eventsAPI.list()
      setEvents(res.data)
      setFiltered(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  useEffect(() => {
    let f = events
    if (search) f = f.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter) f = f.filter(e => e.status === statusFilter)
    setFiltered(f)
  }, [search, statusFilter, events])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    await eventsAPI.delete(id)
    fetchEvents()
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Events" subtitle="Manage and optimize all institutional events" showCreateEvent />

      <div className="flex-1 p-8 space-y-5 overflow-auto">
        {/* Filter row */}
        <div className="glass-card rounded-2xl px-5 py-3.5 flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events..."
              className="input-dark w-full h-9 pl-8 pr-3 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-dark h-9 px-3 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="planned">Planned</option>
            <option value="confirmed">Confirmed</option>
            <option value="conflict">Conflict</option>
            <option value="completed">Completed</option>
          </select>
          <div className="ml-auto text-xs text-white/30">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {['Event', 'Type', 'Date', 'Duration', 'Registrations', 'Att. Forecast', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-white/30">Loading events...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/30">
                        <Calendar size={22} />
                      </div>
                      <p className="text-base font-medium text-white">No events created yet</p>
                      <p className="text-xs text-white/30">
                        Create an event to start forecasting attendance and optimizing campus logistics.
                      </p>
                      <button
                        onClick={() => navigate('/events/new')}
                        className="btn-dark-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
                      >
                        <Plus size={14} />
                        Create Event
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(event => (
                <tr key={event.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-white">{event.name}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-white/50 capitalize">{event.event_type}</td>
                  <td className="px-5 py-3.5 text-sm text-white/60 whitespace-nowrap">{event.date}</td>
                  <td className="px-5 py-3.5 text-sm text-white/60">{event.duration_hours} hrs</td>
                  <td className="px-5 py-3.5 text-sm text-white/80 tabular-nums font-medium">{event.registrations.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-white/60 tabular-nums">
                    {event.expected_participants ? event.expected_participants.toLocaleString() : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[event.status] ?? STATUS_STYLES.draft}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/predictions/${event.id}`)}
                        title="Attendance Prediction"
                        className="p-1.5 text-white/30 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => navigate(`/optimization/${event.id}`)}
                        title="Optimize Resources"
                        className="p-1.5 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-indigo-500/10 transition-colors"
                      >
                        <Zap size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        title="Delete Event"
                        className="p-1.5 text-white/30 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
