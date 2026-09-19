import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, Users, Package, Bell, TriangleAlert, CheckCircle2
} from 'lucide-react'
import Header from '../components/layout/Header'
import { eventsAPI, resourcesAPI } from '../services/api'

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

interface Resource {
  id: number
  resource_type: string
  name: string
  total_quantity: number
  available_quantity: number
  utilization_pct: number
}

const STATUS_STYLES: Record<string, string> = {
  planned:   'bg-blue-50 text-blue-700 border border-blue-200',
  draft:     'bg-slate-100 text-slate-600 border border-slate-200',
  confirmed: 'bg-green-50 text-green-700 border border-green-200',
  conflict:  'bg-red-50 text-red-700 border border-red-200',
  completed: 'bg-purple-50 text-purple-700 border border-purple-200',
  cancelled: 'bg-slate-100 text-slate-500 border border-slate-200',
}

const UTIL_BAR_COLORS: Record<string, string> = {
  computers: 'bg-blue-900',
  projectors: 'bg-indigo-600',
  chairs: 'bg-green-600',
  buses: 'bg-blue-500',
  screens: 'bg-purple-600',
  microphones: 'bg-teal-600',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([eventsAPI.list(), resourcesAPI.list()])
      .then(([evRes, rRes]) => {
        setEvents(evRes.data.slice(0, 5))
        setResources(rRes.data.slice(0, 6))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const upcomingCount = events.filter(e => ['planned', 'draft', 'confirmed'].includes(e.status)).length
  const totalAttendance = events.reduce((s, e) => s + (e.expected_participants || 0), 0)
  const totalAllocated = resources.reduce((s, r) => s + (r.total_quantity - r.available_quantity), 0)
  const conflicts = events.filter(e => e.status === 'conflict').length

  const alerts: Array<{type: string; title: string; detail: string; eventId: number}> = [
    ...events.filter(e => e.status === 'conflict').map(e => ({
      type: 'conflict',
      title: 'Venue Conflict',
      detail: `${e.name} has a venue conflict.`,
      eventId: e.id,
    })),
  ]
  if (resources.find(r => r.resource_type === 'projectors' && r.available_quantity < 10)) {
    alerts.unshift({ type: 'shortage', title: 'Projector Shortage', detail: '2 additional projectors required for upcoming event.', eventId: 1 })
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" showCreateEvent />

      <div className="flex-1 p-8 space-y-6 overflow-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-5">
          <KpiCard icon={<CalendarDays size={18} className="text-blue-700" />} iconBg="bg-blue-50" label="Upcoming Events" value={loading ? '—' : String(upcomingCount)} />
          <KpiCard icon={<Users size={18} className="text-indigo-700" />} iconBg="bg-indigo-50" label="Expected Attendance" value={loading ? '—' : totalAttendance.toLocaleString()} />
          <KpiCard icon={<Package size={18} className="text-green-700" />} iconBg="bg-green-50" label="Resources Allocated" value={loading ? '—' : totalAllocated.toLocaleString()} />
          <KpiCard icon={<Bell size={18} className="text-amber-600" />} iconBg="bg-amber-50" label="Active Alerts" value={loading ? '—' : String(alerts.length + conflicts)} />
        </div>

        {/* Upcoming Events Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Upcoming Events</h2>
            <button onClick={() => navigate('/events')} className="text-sm text-blue-700 font-medium hover:text-blue-900">
              View all →
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Event', 'Date', 'Duration', 'Attendance', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">Loading...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">No events yet. <button onClick={() => navigate('/events/new')} className="text-blue-700 font-medium">Create one →</button></td></tr>
              ) : events.map(event => (
                <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-slate-900">{event.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{event.event_type}</p>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-700">{new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-700">{event.duration_hours} hrs</td>
                  <td className="px-6 py-3.5 text-sm text-slate-700">{event.expected_participants?.toLocaleString() ?? '—'}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[event.status] ?? STATUS_STYLES.draft}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => navigate(`/events/${event.id}`)} className="text-xs text-slate-500 hover:text-slate-900">View</button>
                      {event.status === 'draft' || event.status === 'planned' ? (
                        <button onClick={() => navigate(`/optimization/${event.id}`)} className="text-xs text-blue-700 font-medium hover:text-blue-900">Generate Plan</button>
                      ) : event.status === 'conflict' ? (
                        <button onClick={() => navigate(`/optimization/${event.id}`)} className="text-xs text-red-600 font-medium hover:text-red-800">Resolve</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-5">
          {/* Resource Utilization */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-5">Resource Utilization</h2>
            {loading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : (
              <div className="space-y-4">
                {resources.filter(r => ['computers', 'projectors', 'chairs', 'buses'].includes(r.resource_type)).map(r => (
                  <div key={r.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-700 font-medium capitalize">{r.resource_type}</span>
                      <span className="text-slate-500 tabular-nums">{r.utilization_pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${UTIL_BAR_COLORS[r.resource_type] ?? 'bg-blue-600'} transition-all`}
                        style={{ width: `${r.utilization_pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-5">Active Alerts</h2>
            {alerts.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 size={16} />
                <span>No active alerts. All systems normal.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.slice(0, 4).map((alert, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <TriangleAlert size={16} className="text-amber-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{alert.detail}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/optimization/${alert.eventId}`)}
                      className="text-xs text-blue-700 font-medium hover:text-blue-900 shrink-0"
                    >
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, iconBg, label, value }: { icon: React.ReactNode; iconBg: string; label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className={`inline-flex p-2 rounded ${iconBg} mb-4`}>{icon}</div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
    </div>
  )
}
