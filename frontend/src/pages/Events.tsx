import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Pencil, Eye, Zap, Search } from 'lucide-react'
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
  planned:   'bg-blue-50 text-blue-700 border border-blue-200',
  draft:     'bg-slate-100 text-slate-600 border border-slate-200',
  confirmed: 'bg-green-50 text-green-700 border border-green-200',
  conflict:  'bg-red-50 text-red-700 border border-red-200',
  completed: 'bg-purple-50 text-purple-700 border border-purple-200',
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
    if (!confirm('Delete this event?')) return
    await eventsAPI.delete(id)
    fetchEvents()
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Events" subtitle="Manage all institutional events" showCreateEvent />

      <div className="flex-1 p-8 space-y-5 overflow-auto">
        {/* Filter row */}
        <div className="bg-white border border-slate-200 rounded-lg px-5 py-3.5 flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full h-8 pl-8 pr-3 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-8 px-3 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-600 text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="planned">Planned</option>
            <option value="confirmed">Confirmed</option>
            <option value="conflict">Conflict</option>
            <option value="completed">Completed</option>
          </select>
          <div className="ml-auto text-sm text-slate-500">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Event', 'Type', 'Date', 'Duration', 'Registrations', 'Att. Forecast', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">Loading events...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">No events found.</td></tr>
              ) : filtered.map(event => (
                <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-slate-900">{event.name}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 capitalize">{event.event_type}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 whitespace-nowrap">
                    {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-700">{event.duration_hours} hrs</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 tabular-nums">{event.registrations.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 tabular-nums">{event.expected_participants?.toLocaleString() ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[event.status] ?? STATUS_STYLES.draft}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/predictions/${event.id}`)} title="View prediction" className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => navigate(`/events/${event.id}/edit`)} title="Edit" className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => navigate(`/optimization/${event.id}`)} title="Generate Plan" className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 transition-colors">
                        <Zap size={14} />
                      </button>
                      <button onClick={() => handleDelete(event.id)} title="Delete" className="p-1.5 text-red-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors">
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
